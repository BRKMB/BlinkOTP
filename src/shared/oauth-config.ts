import {
  DEFAULT_GOOGLE_CHROME_CLIENT_ID,
  DEFAULT_GOOGLE_WEB_CLIENT_ID,
  GMAIL_SCOPE,
} from './google-oauth-ids';

/** Chrome extension OAuth client — manifest `oauth2` + `chrome.identity.getAuthToken` (Chrome) */
export const GOOGLE_CHROME_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ?? DEFAULT_GOOGLE_CHROME_CLIENT_ID;

/** Web application OAuth client — `launchWebAuthFlow` (Brave and fallback) */
export const GOOGLE_WEB_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID ?? DEFAULT_GOOGLE_WEB_CLIENT_ID;

/**
 * Web client secret — **local development only**. Never set for `npm run build:store`.
 * Public store builds omit this; Brave uses PKCE without silent refresh.
 */
export const GOOGLE_WEB_CLIENT_SECRET =
  import.meta.env.VITE_GOOGLE_WEB_CLIENT_SECRET ?? '';

/** @deprecated use GOOGLE_CHROME_CLIENT_ID */
export const GOOGLE_CLIENT_ID = GOOGLE_CHROME_CLIENT_ID;

export { GMAIL_SCOPE };
