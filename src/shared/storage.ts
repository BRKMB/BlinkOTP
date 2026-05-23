import { decryptText, encryptText } from './crypto';
import { clampPageToastDurationSec } from './page-toast-settings';
import {
  DEFAULT_SETTINGS,
  type OtpHistoryEntry,
  type UserSettings,
} from './types';

function normalizeSettings(settings: UserSettings): UserSettings {
  return {
    ...settings,
    pageToastDurationSec: clampPageToastDurationSec(settings.pageToastDurationSec),
  };
}

const SETTINGS_KEY = 'blinkotp_settings';
const HISTORY_KEY = 'blinkotp_history';
const TOKEN_PREFIX = 'blinkotp_token_';

const HISTORY_MAX = 5;
const HISTORY_TTL_MS = 24 * 60 * 60 * 1000;

export async function getSettings(): Promise<UserSettings> {
  const { [SETTINGS_KEY]: raw } = await chrome.storage.local.get(SETTINGS_KEY);
  const partial = raw as UserSettings | undefined;
  const merged = { ...DEFAULT_SETTINGS, ...partial };
  merged.accounts = merged.accounts.filter((a) => a.provider === 'gmail');
  if (!merged.activeAccountId && partial?.primaryAccountId) {
    merged.activeAccountId = partial.primaryAccountId;
  }
  if (
    merged.activeAccountId &&
    !merged.accounts.some((a) => a.id === merged.activeAccountId)
  ) {
    merged.activeAccountId = merged.accounts[0]?.id ?? null;
  }
  return normalizeSettings(merged);
}

export async function saveSettings(partial: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getSettings();
  const next = normalizeSettings({ ...current, ...partial });
  await chrome.storage.local.set({ [SETTINGS_KEY]: next });
  return next;
}

export async function storeEncryptedToken(accountId: string, tokenJson: string): Promise<void> {
  const encrypted = await encryptText(tokenJson);
  await chrome.storage.local.set({ [`${TOKEN_PREFIX}${accountId}`]: encrypted });
}

export async function getEncryptedToken(accountId: string): Promise<string | null> {
  const key = `${TOKEN_PREFIX}${accountId}`;
  const data = await chrome.storage.local.get(key);
  const encrypted = data[key] as string | undefined;
  if (!encrypted) return null;
  try {
    return await decryptText(encrypted);
  } catch {
    return null;
  }
}

export async function removeEncryptedToken(accountId: string): Promise<void> {
  await chrome.storage.local.remove(`${TOKEN_PREFIX}${accountId}`);
}

export async function getHistory(): Promise<OtpHistoryEntry[]> {
  const { [HISTORY_KEY]: raw } = await chrome.storage.local.get(HISTORY_KEY);
  const list = (raw as OtpHistoryEntry[] | undefined) ?? [];
  const now = Date.now();
  const fresh = list.filter((e) => now - e.usedAt < HISTORY_TTL_MS).slice(0, HISTORY_MAX);
  if (fresh.length !== list.length) {
    await chrome.storage.local.set({ [HISTORY_KEY]: fresh });
  }
  return fresh;
}

export async function addHistoryEntry(
  entry: Omit<OtpHistoryEntry, 'id'>,
): Promise<OtpHistoryEntry[]> {
  const history = await getHistory();
  const id = crypto.randomUUID();
  const next = [{ ...entry, id }, ...history].slice(0, HISTORY_MAX);
  await chrome.storage.local.set({ [HISTORY_KEY]: next });
  return next;
}

export async function clearHistory(): Promise<void> {
  await chrome.storage.local.remove(HISTORY_KEY);
}

/** Password-style bullets (•), full length — used in popup and privacy mode. */
export function maskCode(code: string, privacyMode: boolean): string {
  if (!privacyMode || !code.length) return code;
  return '•'.repeat(code.length);
}

export function secretMask(code: string, lengthFallback = 6): string {
  const n = code.length || lengthFallback;
  return '•'.repeat(n);
}
