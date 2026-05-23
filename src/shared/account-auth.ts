import type { EmailAccount } from './types';
import { getEncryptedToken } from './storage';

interface StoredToken {
  accessToken: string;
  expiresAt?: number;
  provider: string;
}

const EXPIRY_WARN_MS = 15 * 60 * 1000;

export async function getAccountTokenExpiry(account: EmailAccount): Promise<number | null> {
  if (account.tokenExpiresAt) return account.tokenExpiresAt;
  const raw = await getEncryptedToken(account.id);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredToken;
    return parsed.expiresAt ?? null;
  } catch {
    return null;
  }
}

type Expiry = number | null | undefined;

export function isTokenExpired(expiresAt: Expiry): boolean {
  if (!expiresAt) return false;
  return expiresAt <= Date.now();
}

export function isTokenExpiringSoon(expiresAt: Expiry): boolean {
  if (!expiresAt) return false;
  const remaining = expiresAt - Date.now();
  return remaining > 0 && remaining <= EXPIRY_WARN_MS;
}

/** User-facing: never show countdowns — only whether reconnect is needed. */
export function accountNeedsReconnect(
  account: EmailAccount,
  hasValidToken: boolean,
): boolean {
  if (hasValidToken) return false;
  if (account.authMethod === 'chrome_identity') return true;
  if (account.webAutoRefresh) return true;
  return isTokenExpired(account.tokenExpiresAt);
}

export function accountConnectionLabel(
  account: EmailAccount,
  hasValidToken: boolean,
): string {
  if (accountNeedsReconnect(account, hasValidToken)) return 'Reconnect Gmail';
  if (account.authMethod === 'chrome_identity' || account.webAutoRefresh) {
    return 'Gmail connected';
  }
  return 'Gmail connected';
}

export function formatExpiryRemaining(expiresAt: Expiry): string {
  if (!expiresAt) return 'Active';
  const ms = expiresAt - Date.now();
  if (ms <= 0) return 'Expired';
  const hours = Math.floor(ms / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  if (hours > 24) return `${Math.floor(hours / 24)}d left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}
