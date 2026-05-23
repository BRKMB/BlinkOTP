import { withRetry } from '../shared/retry';
import {
  extractOtpCandidates,
  emailLikelyHasOtp,
  pickBestCandidate,
} from '../shared/otp-extractor';
import {
  GMAIL_SCOPE,
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_WEB_CLIENT_SECRET,
} from '../shared/oauth-config';
import type { ParsedOtpEmail } from '../shared/types';
import { GMAIL_MAX_MESSAGES, GMAIL_OTP_QUERY, GMAIL_RECENT_QUERY } from './constants';

interface GmailMessageRef {
  id: string;
}

interface GmailHeader {
  name: string;
  value: string;
}

function header(headers: GmailHeader[], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function decodeBody(data: string): string {
  try {
    const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(
      atob(normalized)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );
  } catch {
    return '';
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/(div|td|tr|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();
}

interface GmailPayload {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPayload[];
}

function extractTextFromPayload(payload: GmailPayload): string {
  const chunks: string[] = [];

  function walk(part: GmailPayload): void {
    if (part.body?.data) {
      const raw = decodeBody(part.body.data);
      if (part.mimeType === 'text/html') chunks.push(htmlToText(raw));
      else chunks.push(raw);
    }
    part.parts?.forEach(walk);
  }

  walk(payload);
  return chunks.join('\n');
}

function extractToken(result: chrome.identity.GetAuthTokenResult | string | undefined): string {
  if (!result) throw new Error('Google sign-in cancelled');
  if (typeof result === 'string') return result;
  if (result.token) return result.token;
  throw new Error('Google did not return an access token');
}

export async function getGmailAuthToken(options: {
  interactive: boolean;
  chromeAccountId?: string;
}): Promise<string> {
  const details: chrome.identity.TokenDetails = {
    interactive: options.interactive,
    scopes: [GMAIL_SCOPE],
  };
  if (options.chromeAccountId) {
    details.account = { id: options.chromeAccountId };
  }

  const result = await chrome.identity.getAuthToken(details);
  return extractToken(result);
}

async function removeCachedAuthToken(token: string): Promise<void> {
  await chrome.identity.removeCachedAuthToken({ token });
}

async function resolveChromeAccountId(email: string): Promise<string | undefined> {
  const normalized = email.toLowerCase();
  try {
    const accounts = await chrome.identity.getAccounts();
    if (accounts.length === 1 && accounts[0]?.id) {
      return accounts[0].id;
    }
  } catch {
    /* getAccounts may be unavailable outside dev channel */
  }

  try {
    const profile = await chrome.identity.getProfileUserInfo();
    if (profile.id && profile.email?.toLowerCase() === normalized) {
      return profile.id;
    }
  } catch {
    /* identity.email permission required */
  }

  return undefined;
}

export type GmailConnectResult =
  | {
      authMethod: 'chrome_identity';
      accessToken: string;
      email: string;
      chromeAccountId?: string;
    }
  | {
      authMethod: 'web_auth';
      accessToken: string;
      email: string;
      expiresAt: number;
      refreshToken?: string;
    };

/** Brave patches `getAuthToken` in a way Google rejects (400 invalid_request). */
export function isBraveBrowser(): boolean {
  try {
    const nav = navigator as Navigator & { brave?: { isBrave?: () => Promise<boolean> } };
    if (nav.brave?.isBrave) return true;
    return /Brave/i.test(navigator.userAgent);
  } catch {
    return false;
  }
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomPkceVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function pkceChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

export interface WebTokenBundle {
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
}

function parseOAuthRedirectParams(responseUrl: string): URLSearchParams {
  const url = new URL(responseUrl);
  const fromHash = url.hash.replace(/^#/, '');
  const params = new URLSearchParams(fromHash || url.search);
  const err = params.get('error');
  if (err) {
    const desc = params.get('error_description') ?? err;
    throw new Error(desc);
  }
  return params;
}

function parseImplicitRedirect(responseUrl: string): WebTokenBundle {
  const params = parseOAuthRedirectParams(responseUrl);
  const accessToken = params.get('access_token');
  if (!accessToken) throw new Error('Google did not return an access token');
  const expiresIn = Number(params.get('expires_in') ?? 3600);
  return {
    accessToken,
    expiresAt: Date.now() + (Number.isFinite(expiresIn) ? expiresIn : 3600) * 1000,
  };
}

function appendWebClientSecret(body: URLSearchParams): void {
  if (GOOGLE_WEB_CLIENT_SECRET) {
    body.set('client_secret', GOOGLE_WEB_CLIENT_SECRET);
  }
}

async function exchangeAuthCode(
  code: string,
  verifier: string,
  redirectUri: string,
): Promise<WebTokenBundle> {
  const body = new URLSearchParams({
    client_id: GOOGLE_WEB_CLIENT_ID,
    code,
    code_verifier: verifier,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });
  appendWebClientSecret(body);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Token exchange failed (${res.status})`);
  }
  const data = (await res.json()) as {
    access_token: string;
    expires_in?: number;
    refresh_token?: string;
  };
  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    refreshToken: data.refresh_token,
  };
}

/** Silent refresh when a refresh_token was stored (Brave / web client). */
export async function refreshGmailWebAccessToken(refreshToken: string): Promise<WebTokenBundle> {
  const body = new URLSearchParams({
    client_id: GOOGLE_WEB_CLIENT_ID,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  appendWebClientSecret(body);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Refresh failed (${res.status})`);
  }
  const data = (await res.json()) as { access_token: string; expires_in?: number };
  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    refreshToken,
  };
}

async function connectGmailWebAuthPkce(renew: boolean): Promise<WebTokenBundle> {
  const redirectUri = chrome.identity.getRedirectURL();
  const verifier = randomPkceVerifier();
  const challenge = await pkceChallenge(verifier);
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_WEB_CLIENT_ID);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', GMAIL_SCOPE);
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', renew ? 'consent' : 'consent');
  authUrl.searchParams.set('include_granted_scopes', 'true');

  const responseUrl = await chrome.identity.launchWebAuthFlow({
    url: authUrl.toString(),
    interactive: true,
  });
  if (!responseUrl) throw new Error('Google sign-in cancelled');

  const params = parseOAuthRedirectParams(responseUrl);
  const code = params.get('code');
  if (!code) throw new Error('Google did not return an authorization code');
  return exchangeAuthCode(code, verifier, redirectUri);
}

async function connectGmailWebAuthImplicit(renew: boolean): Promise<WebTokenBundle> {
  const redirectUri = chrome.identity.getRedirectURL();
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_WEB_CLIENT_ID);
  authUrl.searchParams.set('response_type', 'token');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', GMAIL_SCOPE);
  authUrl.searchParams.set('prompt', renew ? 'consent' : 'select_account');
  authUrl.searchParams.set('include_granted_scopes', 'true');

  const responseUrl = await chrome.identity.launchWebAuthFlow({
    url: authUrl.toString(),
    interactive: true,
  });
  if (!responseUrl) throw new Error('Google sign-in cancelled');
  return parseImplicitRedirect(responseUrl);
}

/** Web application client — Brave; PKCE + offline refresh (needs client secret in `.env.local`). */
export async function connectGmailWebAuthFlow(renew = false): Promise<GmailConnectResult> {
  let tokens: WebTokenBundle;
  try {
    tokens = await connectGmailWebAuthPkce(renew);
  } catch (pkceErr) {
    if (!GOOGLE_WEB_CLIENT_SECRET) {
      try {
        tokens = await connectGmailWebAuthImplicit(renew);
      } catch {
        throw pkceErr;
      }
    } else {
      throw pkceErr;
    }
  }

  const profile = await fetchGmailProfile(tokens.accessToken);
  return {
    authMethod: 'web_auth',
    accessToken: tokens.accessToken,
    email: profile.email,
    expiresAt: tokens.expiresAt,
    refreshToken: tokens.refreshToken,
  };
}

/** Chrome extension client via `getAuthToken` — auto-refresh on Chrome. */
export async function connectGmailChromeIdentity(renew = false): Promise<GmailConnectResult> {
  if (renew) {
    try {
      const cached = await getGmailAuthToken({ interactive: false });
      await removeCachedAuthToken(cached);
    } catch {
      /* no cached token */
    }
  }

  const accessToken = await getGmailAuthToken({ interactive: true });
  const profile = await fetchGmailProfile(accessToken);
  const chromeAccountId = await resolveChromeAccountId(profile.email);

  return {
    authMethod: 'chrome_identity',
    accessToken,
    email: profile.email,
    chromeAccountId,
  };
}

function shouldFallbackToWebAuth(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  if (/cancelled/i.test(msg)) return false;
  return /invalid|400|invalid_request|OAuth2/i.test(msg);
}

/** Brave → web flow; Chrome → extension identity, with web fallback on failure. */
export async function connectGmailInteractive(renew = false): Promise<GmailConnectResult> {
  if (isBraveBrowser()) {
    return connectGmailWebAuthFlow(renew);
  }
  try {
    return await connectGmailChromeIdentity(renew);
  } catch (err) {
    if (err instanceof Error && /cancelled/i.test(err.message)) throw err;
    if (shouldFallbackToWebAuth(err)) {
      return connectGmailWebAuthFlow(renew);
    }
    throw err;
  }
}

export async function getGmailAccessTokenForAccount(account: {
  email: string;
  chromeAccountId?: string;
}): Promise<string> {
  try {
    return await getGmailAuthToken({
      interactive: false,
      chromeAccountId: account.chromeAccountId,
    });
  } catch {
    return getGmailAuthToken({
      interactive: true,
      chromeAccountId: account.chromeAccountId,
    });
  }
}

export async function revokeGmailToken(token: string): Promise<void> {
  try {
    await removeCachedAuthToken(token);
  } catch {
    /* not a Chrome-cached token */
  }
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
      method: 'POST',
    });
  } catch {
    /* best-effort */
  }
}

async function gmailFetch(path: string, token: string): Promise<Response> {
  return fetch(`https://gmail.googleapis.com/gmail/v1/users/me${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchGmailProfile(token: string): Promise<{ email: string }> {
  const res = await withRetry(() => gmailFetch('/profile', token));
  if (!res.ok) throw new Error(`Gmail profile error: ${res.status}`);
  const data = (await res.json()) as { emailAddress: string };
  return { email: data.emailAddress };
}

async function listMessageIds(token: string, query: string): Promise<string[]> {
  const res = await withRetry(() =>
    gmailFetch(
      `/messages?q=${encodeURIComponent(query)}&maxResults=${GMAIL_MAX_MESSAGES}`,
      token,
    ),
  );
  if (!res.ok) throw new Error(`Gmail list error: ${res.status}`);
  const list = (await res.json()) as { messages?: GmailMessageRef[] };
  return (list.messages ?? []).map((m) => m.id);
}

async function parseGmailMessage(
  token: string,
  id: string,
): Promise<ParsedOtpEmail | null> {
  const msgRes = await withRetry(() => gmailFetch(`/messages/${id}?format=full`, token));
  if (!msgRes.ok) return null;

  const msg = (await msgRes.json()) as {
    id: string;
    snippet?: string;
    internalDate?: string;
    payload?: { headers?: GmailHeader[]; parts?: GmailPayload[]; body?: { data?: string } };
  };

  const headers = msg.payload?.headers ?? [];
  const subject = header(headers, 'Subject');
  const from = header(headers, 'From');
  const snippet = msg.snippet ?? '';
  const bodyText = msg.payload ? extractTextFromPayload(msg.payload as GmailPayload) : '';
  const candidates = extractOtpCandidates(subject, bodyText, snippet);

  if (!emailLikelyHasOtp(subject, bodyText, snippet, candidates)) return null;

  const best = pickBestCandidate(candidates);
  const fromDomain = (from.match(/@([\w.-]+)/) ?? [])[1] ?? '';

  return {
    id,
    accountId: '',
    subject,
    from,
    fromDomain,
    snippet,
    bodyText,
    receivedAt: Number(msg.internalDate ?? Date.now()),
    candidates,
    bestCode: best?.code ?? null,
    bestConfidence: best?.confidence ?? 0,
  };
}

export async function fetchLatestGmailOtps(token: string): Promise<ParsedOtpEmail[]> {
  const idSet = new Set<string>();
  for (const query of [GMAIL_RECENT_QUERY, GMAIL_OTP_QUERY]) {
    try {
      const ids = await listMessageIds(token, query);
      ids.forEach((id) => idSet.add(id));
    } catch {
      /* try next query */
    }
  }

  const results: ParsedOtpEmail[] = [];
  for (const id of idSet) {
    const parsed = await parseGmailMessage(token, id);
    if (parsed) results.push(parsed);
  }

  return results.sort((a, b) => b.receivedAt - a.receivedAt);
}
