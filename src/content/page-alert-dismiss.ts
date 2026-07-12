const STORAGE_KEY = 'blinkotp_dismissed_page_alerts';

/** Stable key so the same Gmail auth issue does not re-open the alert every poll. */
export function pageAlertKey(error: string): string {
  const authLost = error.match(/Gmail access lost for\s+([^\s—]+)/i);
  if (authLost?.[1]) return `gmail-auth-lost:${authLost[1].toLowerCase()}`;
  return `fetch-error:${error.slice(0, 120)}`;
}

export function isGmailAuthLostError(error: string): boolean {
  return /Gmail access lost/i.test(error);
}

export async function isPageAlertDismissed(key: string): Promise<boolean> {
  const data = await chrome.storage.session.get(STORAGE_KEY);
  const list = data[STORAGE_KEY];
  return Array.isArray(list) && list.includes(key);
}

export async function markPageAlertDismissed(key: string): Promise<void> {
  const data = await chrome.storage.session.get(STORAGE_KEY);
  const list = new Set<string>(
    Array.isArray(data[STORAGE_KEY]) ? (data[STORAGE_KEY] as string[]) : [],
  );
  list.add(key);
  await chrome.storage.session.set({ [STORAGE_KEY]: [...list] });
}
