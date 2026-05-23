import type { MessageType, MessageResponse } from './types';

const MESSAGE_TIMEOUT_MS = 12_000;

function wakeServiceWorker(): void {
  try {
    void chrome.runtime.sendMessage({ type: 'PING' });
  } catch {
    /* ignore */
  }
}

export function sendToBackground<T = unknown>(
  message: MessageType,
): Promise<MessageResponse<T>> {
  wakeServiceWorker();

  return new Promise((resolve) => {
    const timer = globalThis.setTimeout(() => {
      resolve({
        ok: false,
        error: 'Background service did not respond. Reload the extension on chrome://extensions.',
      });
    }, MESSAGE_TIMEOUT_MS);

    chrome.runtime.sendMessage(message, (response: MessageResponse<T>) => {
      globalThis.clearTimeout(timer);
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response ?? { ok: false, error: 'No response' });
    });
  });
}

export function sendToTab<T = unknown>(
  tabId: number,
  message: MessageType,
): Promise<MessageResponse<T>> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response: MessageResponse<T>) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response ?? { ok: false, error: 'No response' });
    });
  });
}
