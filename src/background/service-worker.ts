import { domainMismatchWarning } from '../shared/domain-match';
import { sanitizeOtpCode } from '../shared/otp-extractor';
import {
  connectProvider,
  disconnectAccount,
  fetchLatestOtpFromAccounts,
  getAccessToken,
  getOtpInboxWatermark,
  refreshWebAuthAccounts,
  syncAccountsAuth,
} from '../email/provider';
import type { MessageType, MessageResponse, OtpResult, UserSettings } from '../shared/types';
import {
  addHistoryEntry,
  clearHistory,
  getHistory,
  getSettings,
  maskCode,
  removeEncryptedToken,
  saveSettings,
} from '../shared/storage';

let cachedOtp: OtpResult | null = null;
let lastFetchAt = 0;
const FETCH_COOLDOWN_MS = 3000;

async function buildOtpResult(
  email: import('../shared/types').ParsedOtpEmail,
  settings: UserSettings,
): Promise<OtpResult | null> {
  if (!email.bestCode) return null;
  const code = sanitizeOtpCode(email.bestCode);
  if (!code) return null;
  return {
    code,
    confidence: email.bestConfidence,
    email: { ...email, bestCode: code },
    maskedCode: maskCode(code, settings.privacyMode),
  };
}

async function fetchLatestOtp(
  host: string,
  force = false,
  accountId?: string,
  minReceivedAt?: number,
  afterReceivedAt?: number,
): Promise<OtpResult | null> {
  const now = Date.now();
  const cacheFreshEnough =
    afterReceivedAt == null &&
    (!minReceivedAt || (cachedOtp?.email.receivedAt ?? 0) >= minReceivedAt - 60_000);
  if (!force && cachedOtp && now - lastFetchAt < FETCH_COOLDOWN_MS && cacheFreshEnough) {
    return cachedOtp;
  }

  const settings = await getSettings();
  if (!settings.accounts.length) {
    throw new Error('Connect Gmail in BlinkOTP popup first');
  }

  const targetId = accountId ?? settings.activeAccountId ?? undefined;
  const found = await fetchLatestOtpFromAccounts(
    settings.accounts,
    targetId,
    minReceivedAt,
    afterReceivedAt,
  );
  if (!found?.email.bestCode) {
    throw new Error(
      'No verification code found in recent inbox mail. Send a test email with subject "Your verification code" and the code in the body.',
    );
  }

  const result = await buildOtpResult(found.email, settings);
  if (!result) return null;

  cachedOtp = result;
  lastFetchAt = now;

  await addHistoryEntry({
    code: result.code,
    maskedCode: result.maskedCode,
    from: found.email.from,
    siteHost: host,
    receivedAt: found.email.receivedAt,
    usedAt: Date.now(),
  });

  return result;
}

async function resolveTargetTabId(
  sender: chrome.runtime.MessageSender,
): Promise<number | undefined> {
  if (sender.tab?.id) return sender.tab.id;
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.id;
}

async function broadcastOtpToTab(tabId: number, otp: OtpResult, host: string): Promise<void> {
  const settings = await getSettings();
  const warning = settings.domainWarning
    ? domainMismatchWarning(otp.email.fromDomain, host)
    : null;
  const requireConfirm = Boolean(warning);

  try {
    await chrome.tabs.sendMessage(tabId, {
      type: 'OTP_READY',
      payload: otp,
      error: warning ?? undefined,
      requireConfirm,
    } satisfies MessageType & { requireConfirm?: boolean });
  } catch {
    /* tab may not have content script */
  }
}

async function broadcastFetchError(tabId: number, error: string): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'OTP_FETCH_FAILED', error });
  } catch {
    /* ignore */
  }
}

chrome.runtime.onMessage.addListener((message: MessageType, sender, sendResponse) => {
  handleMessage(message, sender)
    .then((response) => sendResponse(response))
    .catch((err: Error) => sendResponse({ ok: false, error: err.message }));
  return true;
});

async function handleMessage(
  message: MessageType,
  sender: chrome.runtime.MessageSender,
): Promise<MessageResponse> {
  if ((message as { type: string }).type === 'PING') {
    return { ok: true, data: 'pong' };
  }

  switch (message.type) {
    case 'GET_SETTINGS': {
      const settings = await getSettings();
      const accounts = await syncAccountsAuth(settings.accounts);
      const synced =
        accounts !== settings.accounts ? await saveSettings({ accounts }) : settings;
      void refreshWebAuthAccounts(synced.accounts).then(async (refreshed) => {
        if (refreshed !== synced.accounts) await saveSettings({ accounts: refreshed });
      });
      return { ok: true, data: synced };
    }
    case 'SAVE_SETTINGS': {
      const settings = await saveSettings(message.settings);
      return { ok: true, data: settings };
    }
    case 'CONNECT_PROVIDER': {
      if (message.provider !== 'gmail') {
        return { ok: false, error: 'Only Gmail is supported in this version' };
      }
      const settings = await getSettings();
      const renew = Boolean(message.renew);
      const account = await connectProvider(renew);
      const emailKey = account.email.toLowerCase();
      const existing = settings.accounts.find((a) => a.email.toLowerCase() === emailKey);

      if (existing && !renew) {
        const token = await getAccessToken(existing);
        if (token) {
          return {
            ok: false,
            error: `${account.email} is already connected. Open the account list to switch, or add a different Gmail.`,
          };
        }
      }

      for (const old of settings.accounts.filter((a) => a.email.toLowerCase() === emailKey)) {
        await disconnectAccount(old);
        await removeEncryptedToken(old.id);
      }

      const others = settings.accounts.filter((a) => a.email.toLowerCase() !== emailKey);
      const accounts = [...others, { ...account, isPrimary: false }];
      let activeAccountId = settings.activeAccountId;
      if (!activeAccountId || !accounts.some((a) => a.id === activeAccountId)) {
        activeAccountId = account.id;
      }
      if (renew && existing) activeAccountId = account.id;
      let updated = await saveSettings({ accounts, activeAccountId });
      const synced = await syncAccountsAuth(updated.accounts);
      if (synced !== updated.accounts) {
        updated = await saveSettings({ accounts: synced });
      }
      await updateAuthBadge(updated.accounts);
      return { ok: true, data: updated };
    }
    case 'DISCONNECT_ACCOUNT': {
      const settings = await getSettings();
      const account = settings.accounts.find((a) => a.id === message.accountId);
      if (account) await disconnectAccount(account);
      await removeEncryptedToken(message.accountId);
      const accounts = settings.accounts.filter((a) => a.id !== message.accountId);
      const activeAccountId =
        settings.activeAccountId === message.accountId
          ? (accounts[0]?.id ?? null)
          : settings.activeAccountId;
      const updated = await saveSettings({ accounts, activeAccountId });
      await updateAuthBadge(updated.accounts);
      return { ok: true, data: updated };
    }
    case 'FETCH_LATEST_OTP': {
      try {
        const otp = await fetchLatestOtp(
          message.host,
          message.force,
          message.accountId,
          message.minReceivedAt,
          message.afterReceivedAt,
        );
        if (!otp) {
          const err = 'No verification code found in your inbox';
          const tabId = await resolveTargetTabId(sender);
          if (tabId) await broadcastFetchError(tabId, err);
          return { ok: false, error: err };
        }
        const tabId = await resolveTargetTabId(sender);
        if (tabId) await broadcastOtpToTab(tabId, otp, message.host);
        return { ok: true, data: otp };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Fetch failed';
        const waitingForNew =
          message.afterReceivedAt != null &&
          (msg.includes('No new verification code') || msg.includes('wait a moment'));
        const tabId = await resolveTargetTabId(sender);
        if (tabId && !waitingForNew) await broadcastFetchError(tabId, msg);
        return { ok: false, error: msg };
      }
    }
    case 'GET_OTP_WATERMARK': {
      try {
        const settings = await getSettings();
        if (!settings.accounts.length) {
          return { ok: false, error: 'Connect Gmail in BlinkOTP popup first' };
        }
        const targetId = message.accountId ?? settings.activeAccountId ?? undefined;
        const watermark = await getOtpInboxWatermark(settings.accounts, targetId);
        return { ok: true, data: watermark || Date.now() };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Watermark failed' };
      }
    }
    case 'FILL_OTP': {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tabId = message.tabId ?? tabs[0]?.id;
      if (!tabId) return { ok: false, error: 'No active tab' };
      await chrome.tabs.sendMessage(tabId, {
        type: 'REQUEST_FILL_ON_PAGE',
        code: message.code,
      });
      return { ok: true };
    }
    case 'GET_HISTORY': {
      const history = await getHistory();
      return { ok: true, data: history };
    }
    case 'CLEAR_HISTORY': {
      await clearHistory();
      return { ok: true, data: [] };
    }
    default:
      return { ok: false, error: 'Unknown message type' };
  }
}

chrome.commands.onCommand.addListener(async (command) => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab?.id || !tab.url) return;
  let host = '';
  try {
    host = new URL(tab.url).hostname;
  } catch {
    return;
  }

  if (command === 'fetch-latest-otp') {
    const otp = await fetchLatestOtp(host, true);
    if (otp) await broadcastOtpToTab(tab.id, otp, host);
  }

  if (command === 'fill-latest-otp') {
    const otp = cachedOtp ?? (await fetchLatestOtp(host, true));
    if (otp) {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'REQUEST_FILL_ON_PAGE',
        code: otp.code,
      });
    }
  }
});

async function updateAuthBadge(accounts: import('../shared/types').EmailAccount[]): Promise<void> {
  let needsRenew = false;
  for (const account of accounts) {
    try {
      if (!(await getAccessToken(account))) needsRenew = true;
    } catch {
      needsRenew = true;
    }
  }
  await chrome.action.setBadgeText({ text: needsRenew ? '!' : '' });
  await chrome.action.setBadgeBackgroundColor({ color: '#a855f7' });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'blinkotp_token_refresh') {
    const settings = await getSettings();
    const accounts = await syncAccountsAuth(settings.accounts);
    const saved =
      accounts !== settings.accounts ? await saveSettings({ accounts }) : settings;
    await updateAuthBadge(saved.accounts);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('blinkotp_token_refresh', { periodInMinutes: 15 });
  void getSettings().then(async (s) => {
    const accounts = await syncAccountsAuth(s.accounts);
    const saved = accounts !== s.accounts ? await saveSettings({ accounts }) : s;
    await updateAuthBadge(saved.accounts);
  });
});
