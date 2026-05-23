import type { OtpFieldGroup } from './detector';
import type { OtpResult } from '../shared/types';

type Listener = () => void;

export type ContentUiMessage =
  | { type: 'OTP_READY'; payload: OtpResult; error?: string }
  | { type: 'OTP_FETCH_FAILED'; error: string }
  | { type: 'OTP_FETCH_STARTED'; waiting?: boolean }
  | { type: 'OTP_WAITING_NEW' }
  | { type: 'OTP_POPUP_OPEN'; waiting?: boolean }
  | { type: 'OTP_POPUP_CLOSE' };

let activeGroup: OtpFieldGroup | null = null;
let showBubble = true;
let listeners = new Set<Listener>();
const uiMessageListeners = new Set<(message: ContentUiMessage) => void>();

export function subscribeContentUi(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function subscribeOtpUi(fn: (message: ContentUiMessage) => void): () => void {
  uiMessageListeners.add(fn);
  return () => uiMessageListeners.delete(fn);
}

function notify(): void {
  listeners.forEach((fn) => fn());
}

export function getContentGroup(): OtpFieldGroup | null {
  return activeGroup;
}

export function setContentGroup(group: OtpFieldGroup | null): void {
  activeGroup = group;
  notify();
}

export function getShowBubble(): boolean {
  return showBubble;
}

export function setShowBubble(value: boolean): void {
  showBubble = value;
  notify();
}

/** Dispatch to in-page React UI (content scripts do not receive their own runtime.sendMessage). */
export function pushOtpToUi(message: ContentUiMessage): void {
  uiMessageListeners.forEach((fn) => {
    try {
      fn(message);
    } catch {
      /* ignore listener errors */
    }
  });
}
