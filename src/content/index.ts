import { sendToBackground } from '../shared/runtime-messaging';
import { sanitizeOtpCode } from '../shared/otp-extractor';
import {
  isNonOtpSettingsUrl,
  isOtpEntryReady,
  watchOtpFields,
  type OtpFieldGroup,
} from './detector';
import { previewPageToast } from './preview-page-toast';
import { fillOtpGroup, tryAutoSubmit } from './filler';
import { pushOtpToUi, setContentGroup, setShowBubble } from './content-ui-bridge';
import { ContentRoot, setContentHandlers } from './ui/ContentRoot';
import type { OtpResult } from '../shared/types';
import { mountReactUi, mountShadowUi, syncContentUiTheme } from './ui/mount';
import { createElement } from 'react';

let activeGroup: OtpFieldGroup | null = null;
let host = '';
let pollTimer: ReturnType<typeof setInterval> | null = null;
let autoFetchStarted = false;
let lastAutomationHref = location.href;
/** Only accept OTP emails newer than inbox state when the code field appeared. */
let inboxWatermarkAt = 0;
let waitingForNewCode = false;
let lastAutoFilledCode: string | null = null;
let pendingOtpCode: string | null = null;
let pendingRequireConfirm = false;
let uiMounted = false;

let settingsCache: {
  theme?: 'dark' | 'light';
  showBubble?: boolean;
  autoFill?: boolean;
  autoCopyFallback?: boolean;
  autoSubmit?: boolean;
  autoFetchOnVerificationPages?: boolean;
  useLatestCodeImmediately?: boolean;
} = {};

function useInboxWatermark(): boolean {
  return settingsCache.useLatestCodeImmediately !== true;
}

const POLL_MS = 4_000;
const POLL_MS_WAITING = 3_000;

function getHost(): string {
  try {
    return new URL(location.href).hostname;
  } catch {
    return '';
  }
}

function stopPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function startPolling(): void {
  if (pollTimer) return;
  const interval = waitingForNewCode ? POLL_MS_WAITING : POLL_MS;
  pollTimer = setInterval(() => void fetchAndShow(true), interval);
}

async function fetchLatestCodeNow(): Promise<void> {
  waitingForNewCode = false;
  inboxWatermarkAt = 0;
  stopPolling();
  pushOtpToUi({ type: 'OTP_FETCH_STARTED', waiting: false });
  await fetchAndShow(true, true);
}

async function fetchAndShow(force = false, manual = false): Promise<void> {
  pushOtpToUi({ type: 'OTP_FETCH_STARTED', waiting: waitingForNewCode });

  const res = await sendToBackground({
    type: 'FETCH_LATEST_OTP',
    host,
    force,
    afterReceivedAt:
      manual || !useInboxWatermark() ? undefined : inboxWatermarkAt || undefined,
  });

  if (!res.ok && res.error) {
    const waiting =
      useInboxWatermark() &&
      !manual &&
      (res.error.includes('No new verification code') ||
        res.error.includes('wait a moment'));
    if (waiting) {
      waitingForNewCode = true;
      pushOtpToUi({ type: 'OTP_WAITING_NEW' });
      stopPolling();
      startPolling();
      return;
    }
    if (res.error.includes('Gmail access lost')) {
      stopPolling();
    }
    pushOtpToUi({ type: 'OTP_FETCH_FAILED', error: res.error });
    return;
  }

  if (res.ok && res.data) {
    waitingForNewCode = false;
    stopPolling();
    pushOtpToUi({ type: 'OTP_READY', payload: res.data as OtpResult });
  }
}

function applyTheme(theme: 'dark' | 'light'): void {
  document.documentElement.setAttribute('data-blinkotp-theme', theme);
  syncContentUiTheme(theme);
}

function tryAutoFillWithSettings(code: string, requireConfirm?: boolean): void {
  if (waitingForNewCode) return;

  const group = activeGroup ?? isOtpEntryReady() ?? null;
  if (!group) {
    pendingOtpCode = code;
    pendingRequireConfirm = Boolean(requireConfirm);
    return;
  }

  if (code === lastAutoFilledCode) return;

  activeGroup = group;
  setContentGroup(group);
  pendingOtpCode = null;
  pendingRequireConfirm = false;

  chrome.storage.local.get('blinkotp_settings', (data) => {
    const settings = data.blinkotp_settings as {
      autoFill?: boolean;
      autoCopyFallback?: boolean;
      autoSubmit?: boolean;
    } | undefined;
    if (requireConfirm || settings?.autoFill === false) return;
    const filled = fillOtpGroup(group, code);
    if (!filled && settings?.autoCopyFallback !== false) {
      void navigator.clipboard.writeText(code);
    } else if (filled) {
      lastAutoFilledCode = code;
    }
    if (settings?.autoSubmit) tryAutoSubmit();
  });
}

function shouldRunAutoFetch(): boolean {
  if (settingsCache.autoFetchOnVerificationPages === false) return false;
  if (isNonOtpSettingsUrl()) return false;
  return Boolean(activeGroup);
}

function resetAutomationForNavigation(): void {
  lastAutomationHref = location.href;
  autoFetchStarted = false;
  inboxWatermarkAt = 0;
  waitingForNewCode = false;
  lastAutoFilledCode = null;
  pendingOtpCode = null;
  pendingRequireConfirm = false;
  stopPolling();
}

async function startAutoFetch(): Promise<void> {
  if (!shouldRunAutoFetch() || autoFetchStarted) return;

  autoFetchStarted = true;
  lastAutoFilledCode = null;

  const smartWait = useInboxWatermark();
  waitingForNewCode = smartWait;
  pushOtpToUi({ type: 'OTP_POPUP_OPEN', waiting: smartWait });

  if (smartWait) {
    const wmRes = await sendToBackground<number>({ type: 'GET_OTP_WATERMARK' });
    inboxWatermarkAt = wmRes.ok && typeof wmRes.data === 'number' ? wmRes.data : Date.now();
  } else {
    inboxWatermarkAt = 0;
  }

  void fetchAndShow(true, false);
  startPolling();
}

function syncAutomation(): void {
  if (location.href !== lastAutomationHref) {
    resetAutomationForNavigation();
  }

  if (!shouldRunAutoFetch()) {
    stopPolling();
    autoFetchStarted = false;
    pushOtpToUi({ type: 'OTP_POPUP_CLOSE' });
    return;
  }

  if (!autoFetchStarted) {
    void startAutoFetch();
  }

  if (pendingOtpCode && !waitingForNewCode) {
    tryAutoFillWithSettings(pendingOtpCode, pendingRequireConfirm);
  }
}

function ensureUiMounted(): void {
  if (uiMounted) return;

  mountShadowUi((container) => {
    const theme =
      (document.documentElement.getAttribute('data-blinkotp-theme') as 'dark' | 'light') ?? 'dark';
    container.setAttribute('data-theme', theme);
    mountReactUi(container, createElement(ContentRoot));
  });

  setContentHandlers({
    onFill: (code, group) => {
      const filled = fillOtpGroup(group, code);
      if (!filled) {
        void navigator.clipboard.writeText(code);
      } else {
        lastAutoFilledCode = code;
      }
      chrome.storage.local.get('blinkotp_settings').then((data) => {
        const settings = data.blinkotp_settings as { autoSubmit?: boolean } | undefined;
        if (settings?.autoSubmit) tryAutoSubmit();
      });
    },
    onFetch: () => {
      pushOtpToUi({ type: 'OTP_POPUP_OPEN', waiting: false });
      waitingForNewCode = false;
      inboxWatermarkAt = 0;
      void fetchAndShow(true, true);
    },
    onUseLatestCode: () => {
      void fetchLatestCodeNow();
    },
  });

  uiMounted = true;
}

function setActiveGroup(group: OtpFieldGroup | null): void {
  activeGroup = group;
  setContentGroup(group);
}

chrome.runtime.onMessage.addListener(
  (message: {
    type: string;
    mode?: 'waiting' | 'ready';
    code?: string;
    payload?: OtpResult & { code: string };
    requireConfirm?: boolean;
    error?: string;
  }) => {
    if (message.type === 'PREVIEW_PAGE_TOAST' && message.mode) {
      ensureUiMounted();
      previewPageToast(message.mode);
      return;
    }

    if (message.type === 'REQUEST_FILL_ON_PAGE' && message.code) {
      const group = activeGroup ?? isOtpEntryReady() ?? null;
      const code = sanitizeOtpCode(message.code);
      if (!group) {
        void navigator.clipboard.writeText(code);
        return;
      }
      setActiveGroup(group);
      const ok = fillOtpGroup(group, code);
      if (!ok) void navigator.clipboard.writeText(code);
      else lastAutoFilledCode = code;
      return;
    }

    if (message.type === 'OTP_READY' && message.payload?.code) {
      if (message.payload.email?.id === 'preview') return;
      waitingForNewCode = false;
      pushOtpToUi({
        type: 'OTP_READY',
        payload: message.payload as OtpResult,
        error: message.error,
      });
      const code = sanitizeOtpCode(message.payload.code);
      tryAutoFillWithSettings(code, message.requireConfirm);
    }
  },
);

chrome.storage.onChanged.addListener((changes) => {
  if (changes.blinkotp_settings) {
    const prev = changes.blinkotp_settings.oldValue as typeof settingsCache | undefined;
    const settings = changes.blinkotp_settings.newValue as typeof settingsCache;
    settingsCache = { ...settingsCache, ...settings };
    if (settings?.theme) applyTheme(settings.theme);
    setShowBubble(settings?.showBubble !== false);
    if (
      prev?.useLatestCodeImmediately !== settings?.useLatestCodeImmediately &&
      autoFetchStarted
    ) {
      resetAutomationForNavigation();
    }
    syncAutomation();
  }
});

async function init(): Promise<void> {
  host = getHost();
  const settingsRes = await sendToBackground<typeof settingsCache>({ type: 'GET_SETTINGS' });
  settingsCache = settingsRes.ok ? (settingsRes.data ?? {}) : {};
  applyTheme(settingsCache.theme ?? 'dark');
  setShowBubble(settingsCache.showBubble !== false);
  ensureUiMounted();

  watchOtpFields((groups) => {
    setActiveGroup(groups[0] ?? null);
    syncAutomation();
  });

  setActiveGroup(isOtpEntryReady());
  syncAutomation();
}

void init();
