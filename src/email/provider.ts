import {
  connectGmailInteractive,
  fetchLatestGmailOtps,
  getGmailAccessTokenForAccount,
  refreshGmailWebAccessToken,
  revokeGmailToken,
} from './gmail';
import type { EmailAccount, ParsedOtpEmail } from '../shared/types';
import { getEncryptedToken, removeEncryptedToken, storeEncryptedToken } from '../shared/storage';

interface StoredGmailToken {
  accessToken: string;
  expiresAt?: number;
  refreshToken?: string;
  provider: 'gmail';
}

const MIN_CONFIDENCE = 0.45;
const REFRESH_BUFFER_MS = 10 * 60 * 1000;

async function loadStoredToken(accountId: string): Promise<StoredGmailToken | null> {
  const raw = await getEncryptedToken(accountId);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredGmailToken;
  } catch {
    return null;
  }
}

async function persistStoredToken(accountId: string, token: StoredGmailToken): Promise<void> {
  await storeEncryptedToken(accountId, JSON.stringify(token));
}

/** Refresh web-auth access before expiry when a refresh_token exists. */
export async function tryRefreshWebToken(account: EmailAccount): Promise<StoredGmailToken | null> {
  const parsed = await loadStoredToken(account.id);
  if (!parsed?.refreshToken) return parsed;

  const expires = parsed.expiresAt ?? 0;
  if (expires - Date.now() > REFRESH_BUFFER_MS) return parsed;

  try {
    const fresh = await refreshGmailWebAccessToken(parsed.refreshToken);
    const next: StoredGmailToken = {
      ...parsed,
      accessToken: fresh.accessToken,
      expiresAt: fresh.expiresAt,
      refreshToken: fresh.refreshToken ?? parsed.refreshToken,
    };
    await persistStoredToken(account.id, next);
    return next;
  } catch {
    return parsed;
  }
}

function accountWithStoredAuth(account: EmailAccount, parsed: StoredGmailToken | null): EmailAccount {
  const hasRefresh = Boolean(parsed?.refreshToken);
  return {
    ...account,
    webAutoRefresh: hasRefresh,
    authMethod: account.authMethod ?? (hasRefresh ? 'web_auth' : account.authMethod),
    tokenExpiresAt: hasRefresh ? undefined : parsed?.expiresAt ?? account.tokenExpiresAt,
  };
}

/** Align account flags with encrypted storage + refresh tokens silently. */
export async function syncAccountsAuth(accounts: EmailAccount[]): Promise<EmailAccount[]> {
  let changed = false;
  let next = await Promise.all(
    accounts.map(async (account) => {
      if (account.provider !== 'gmail') return account;
      const stored = await loadStoredToken(account.id);
      const merged = accountWithStoredAuth(account, stored);
      if (
        merged.webAutoRefresh !== account.webAutoRefresh ||
        merged.tokenExpiresAt !== account.tokenExpiresAt
      ) {
        changed = true;
      }
      return merged;
    }),
  );

  const refreshed = await refreshWebAuthAccounts(next);
  if (refreshed !== next) {
    changed = true;
    next = refreshed;
  }

  return changed ? next : accounts;
}

export async function refreshWebAuthAccounts(accounts: EmailAccount[]): Promise<EmailAccount[]> {
  let changed = false;
  const next = await Promise.all(
    accounts.map(async (account) => {
      const stored = await loadStoredToken(account.id);
      if (!stored?.refreshToken) {
        const merged = accountWithStoredAuth(account, stored);
        if (
          merged.webAutoRefresh !== account.webAutoRefresh ||
          merged.tokenExpiresAt !== account.tokenExpiresAt
        ) {
          changed = true;
        }
        return merged;
      }
      const parsed = await tryRefreshWebToken(account);
      const merged = accountWithStoredAuth(account, parsed ?? stored);
      if (
        merged.webAutoRefresh !== account.webAutoRefresh ||
        merged.tokenExpiresAt !== account.tokenExpiresAt
      ) {
        changed = true;
      }
      return merged;
    }),
  );
  return changed ? next : accounts;
}

export async function connectProvider(renew = false): Promise<EmailAccount> {
  const id = crypto.randomUUID();
  const result = await connectGmailInteractive(renew);

  if (result.authMethod === 'web_auth') {
    await persistStoredToken(id, {
      accessToken: result.accessToken,
      expiresAt: result.expiresAt,
      refreshToken: result.refreshToken,
      provider: 'gmail',
    });
    const hasRefresh = Boolean(result.refreshToken);
    return {
      id,
      provider: 'gmail',
      email: result.email,
      isPrimary: false,
      connectedAt: Date.now(),
      tokenKey: id,
      authMethod: 'web_auth',
      webAutoRefresh: hasRefresh,
      tokenExpiresAt: hasRefresh ? undefined : result.expiresAt,
    };
  }

  return {
    id,
    provider: 'gmail',
    email: result.email,
    isPrimary: false,
    connectedAt: Date.now(),
    tokenKey: id,
    authMethod: 'chrome_identity',
    chromeAccountId: result.chromeAccountId,
    tokenExpiresAt: undefined,
  };
}

export async function getAccessToken(account: EmailAccount): Promise<string | null> {
  if (account.authMethod === 'web_auth') {
    const parsed = (await tryRefreshWebToken(account)) ?? (await loadStoredToken(account.id));
    if (!parsed?.accessToken) return null;
    if (parsed.expiresAt && parsed.expiresAt <= Date.now()) return null;
    return parsed.accessToken;
  }

  const useChromeIdentity =
    account.authMethod === 'chrome_identity' ||
    (!!account.chromeAccountId && account.tokenExpiresAt === undefined);

  if (useChromeIdentity) {
    try {
      return await getGmailAccessTokenForAccount({
        email: account.email,
        chromeAccountId: account.chromeAccountId,
      });
    } catch {
      /* fall through */
    }
  }

  const raw = await getEncryptedToken(account.id);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredGmailToken;
    if (parsed.expiresAt && parsed.expiresAt < Date.now()) return null;
    return parsed.accessToken;
  } catch {
    return null;
  }
}

export async function disconnectAccount(account: EmailAccount): Promise<void> {
  try {
    const token = await getGmailAccessTokenForAccount({
      email: account.email,
      chromeAccountId: account.chromeAccountId,
    });
    await revokeGmailToken(token);
  } catch {
    const parsed = await loadStoredToken(account.id);
    if (parsed?.accessToken) await revokeGmailToken(parsed.accessToken);
  }
  await removeEncryptedToken(account.id);
}

export async function fetchOtpsForAccount(account: EmailAccount): Promise<ParsedOtpEmail[]> {
  const token = await getAccessToken(account);
  if (!token) {
    throw new Error(
      `Gmail access lost for ${account.email} — open BlinkOTP and tap Renew access`,
    );
  }
  const emails = await fetchLatestGmailOtps(token);
  return emails.map((e) => ({ ...e, accountId: account.id }));
}

export async function getOtpInboxWatermark(
  accounts: EmailAccount[],
  accountId?: string | null,
): Promise<number> {
  let gmailAccounts = accounts.filter((a) => a.provider === 'gmail');
  if (accountId) {
    gmailAccounts = gmailAccounts.filter((a) => a.id === accountId);
  }

  let maxReceived = 0;
  for (const account of gmailAccounts) {
    try {
      const emails = await fetchOtpsForAccount(account);
      for (const e of emails) {
        if (e.bestCode && e.bestConfidence >= MIN_CONFIDENCE) {
          maxReceived = Math.max(maxReceived, e.receivedAt);
        }
      }
    } catch {
      /* try next account */
    }
  }
  return maxReceived;
}

export async function fetchLatestOtpFromAccounts(
  accounts: EmailAccount[],
  accountId?: string | null,
  minReceivedAt?: number,
  afterReceivedAt?: number,
): Promise<{ email: ParsedOtpEmail; account: EmailAccount } | null> {
  const minTs = minReceivedAt ? minReceivedAt - 60_000 : 0;
  let gmailAccounts = accounts.filter((a) => a.provider === 'gmail');
  if (accountId) {
    gmailAccounts = gmailAccounts.filter((a) => a.id === accountId);
  }

  let lastError: string | null = null;
  let bestOverall: { email: ParsedOtpEmail; account: EmailAccount } | null = null;

  for (const account of gmailAccounts) {
    try {
      const emails = await fetchOtpsForAccount(account);
      const ranked = emails
        .filter(
          (e) =>
            e.bestCode &&
            e.bestConfidence >= MIN_CONFIDENCE &&
            (afterReceivedAt == null || e.receivedAt > afterReceivedAt) &&
            (!minTs || e.receivedAt >= minTs),
        )
        .sort((a, b) => b.receivedAt - a.receivedAt || b.bestConfidence - a.bestConfidence);

      const best = ranked[0];
      if (!best?.bestCode) continue;

      if (
        !bestOverall ||
        best.receivedAt > bestOverall.email.receivedAt ||
        (best.receivedAt === bestOverall.email.receivedAt &&
          best.bestConfidence > bestOverall.email.bestConfidence)
      ) {
        bestOverall = { email: best, account };
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Email fetch failed';
    }
  }

  if (bestOverall) return bestOverall;
  if (lastError) throw new Error(lastError);
  if (afterReceivedAt != null || minReceivedAt) {
    throw new Error('No new verification code in your inbox yet — wait a moment and try again');
  }
  return null;
}
