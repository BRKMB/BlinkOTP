export type EmailProvider = 'gmail';

/** How Gmail OAuth was established */
export type GmailAuthMethod = 'chrome_identity' | 'web_auth';

export interface EmailAccount {
  id: string;
  provider: EmailProvider;
  email: string;
  isPrimary: boolean;
  connectedAt: number;
  /** Provider-specific opaque token reference (encrypted blob key) */
  tokenKey: string;
  /** Chrome identity account id — enables silent token refresh */
  chromeAccountId?: string;
  /** chrome_identity = auto-refresh; web_auth = Brave / fallback */
  authMethod?: GmailAuthMethod;
  /** web_auth + refresh token stored — background refresh, no hourly Renew */
  webAutoRefresh?: boolean;
  /** Set for web_auth; unset for chrome_identity */
  tokenExpiresAt?: number;
}

export interface OtpCandidate {
  code: string;
  confidence: number;
  format: 'numeric' | 'alphanumeric' | 'grouped';
  source: 'subject' | 'body' | 'snippet';
}

export interface ParsedOtpEmail {
  id: string;
  accountId: string;
  subject: string;
  from: string;
  fromDomain: string;
  snippet: string;
  bodyText: string;
  receivedAt: number;
  candidates: OtpCandidate[];
  bestCode: string | null;
  bestConfidence: number;
}

export interface OtpResult {
  code: string;
  confidence: number;
  email: ParsedOtpEmail;
  maskedCode: string;
}

export interface OtpHistoryEntry {
  id: string;
  code: string;
  maskedCode: string;
  from: string;
  siteHost: string;
  receivedAt: number;
  usedAt: number;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  privacyMode: boolean;
  autoFill: boolean;
  autoCopyFallback: boolean;
  autoSubmit: boolean;
  domainWarning: boolean;
  showBubble: boolean;
  /** Fetch + toast when the page looks like a verification / login step */
  autoFetchOnVerificationPages: boolean;
  /** Auto-fetch: use newest inbox OTP immediately instead of waiting for a newer email */
  useLatestCodeImmediately: boolean;
  /** Seconds to show the top-left toast after a code is ready (5–60) */
  pageToastDurationSec: number;
  accounts: EmailAccount[];
  /** Last-selected inbox in popup (all accounts are equal) */
  activeAccountId: string | null;
  /** @deprecated unused — kept for storage migration only */
  primaryAccountId?: string | null;
}

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  privacyMode: true,
  autoFill: true,
  autoCopyFallback: true,
  autoSubmit: false,
  domainWarning: true,
  showBubble: true,
  autoFetchOnVerificationPages: true,
  useLatestCodeImmediately: false,
  pageToastDurationSec: 12,
  accounts: [],
  activeAccountId: null,
};

export type MessageType =
  | {
      type: 'FETCH_LATEST_OTP';
      host: string;
      force?: boolean;
      accountId?: string;
      /** Ignore inbox messages older than this (ms since epoch). */
      minReceivedAt?: number;
      /** Only emails strictly newer than this timestamp (auto-fetch session watermark). */
      afterReceivedAt?: number;
    }
  | { type: 'GET_OTP_WATERMARK'; accountId?: string }
  | { type: 'FILL_OTP'; code: string; tabId?: number }
  | { type: 'GET_SETTINGS' }
  | { type: 'SAVE_SETTINGS'; settings: Partial<UserSettings> }
  | { type: 'CONNECT_PROVIDER'; provider: EmailProvider; renew?: boolean }
  | { type: 'DISCONNECT_ACCOUNT'; accountId: string }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'GET_HISTORY' }
  | { type: 'OTP_READY'; payload: OtpResult | null; error?: string }
  | { type: 'SETTINGS_UPDATED'; settings: UserSettings }
  | { type: 'HISTORY_UPDATED'; history: OtpHistoryEntry[] }
  | { type: 'DETECTED_OTP_FIELD'; host: string }
  | { type: 'REQUEST_FILL_ON_PAGE'; code: string; requireConfirm?: boolean }
  | { type: 'PREVIEW_PAGE_TOAST'; mode: 'waiting' | 'ready' };

export interface MessageResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}
