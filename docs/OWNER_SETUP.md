# BlinkOTP — Owner setup guide

Step-by-step instructions to configure OAuth, build, and publish BlinkOTP on the Chrome Web Store at **zero infrastructure cost**.

> **Arabic publish walkthrough:** [PUBLISH_AR.md](./PUBLISH_AR.md)

## Prerequisites

- Google account (for Chrome Web Store developer registration — **one-time $5 USD** registration fee paid to Google, not BlinkOTP infrastructure)
- Node.js 20+
- No servers, databases, or paid APIs required

## 1. Google Cloud (Gmail API)

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project (e.g. `blinkotp-production`).
3. Enable **Gmail API**.
4. Configure **OAuth consent screen**:
   - User type: External (for public store) or Internal (for org-only testing)
   - Scopes: `https://www.googleapis.com/auth/gmail.readonly`
   - Add privacy policy URL (host `docs/PRIVACY_POLICY.md` on your site or GitHub Pages)
5. Create **OAuth 2.0 Client ID** → Application type: **Chrome extension** (important)
   - Extension ID: your unpacked ID from `chrome://extensions` (Developer mode → ID under the extension name). **After Chrome Web Store publish, use the store Item ID instead** — it is usually different from unpacked.
   - Copy the **Chrome extension** client ID (not the old Web application client)
6. On **OAuth consent screen** → **Data access** → add scope:
   - `https://www.googleapis.com/auth/gmail.readonly`
7. If app is in **Testing**, add each tester Gmail under **Test users** (max 100). **Public store requires Publishing status → In production + OAuth verification** (see below).
8. Copy client IDs into `.env.local` (see `.env.example`):
   - `VITE_GOOGLE_CLIENT_ID` — Chrome extension client
   - `VITE_GOOGLE_WEB_CLIENT_ID` — Web application client (Brave)
   - `VITE_GOOGLE_WEB_CLIENT_SECRET` — from GCP → Web client → **Client secret** (enables silent refresh on Brave; never commit)
9. Rebuild: `npm run build` and **Reload** the extension

BlinkOTP uses **two** Google OAuth clients:

| Client type | When used | Token lifetime |
|-------------|-----------|----------------|
| **Chrome extension** (`8dj3…`) | Google Chrome + `getAuthToken` | Auto-refresh (no hourly Renew) |
| **Web application** (`nqruc…`) | **Brave** and fallback | Silent refresh when `VITE_GOOGLE_WEB_CLIENT_SECRET` is set |

**Brave users:** Google returns `Error 400: invalid_request` for extension `getAuthToken` — this is a Brave limitation, not your extension ID. BlinkOTP automatically uses the Web client on Brave.

**Web application client** → Authorized redirect URIs must include:

- `https://<YOUR_EXTENSION_ID>.chromiumapp.org/`

Get the exact URL: load the extension → DevTools on any page → `chrome.identity.getRedirectURL()`. Use the **Chrome Web Store Item ID** after your first listing draft, not the unpacked dev ID.

> **Upgrading from an older build?** Remove the old account in Settings and **Connect Gmail** again.

> **Error 400 on Chrome (not Brave)?** Edit the **Chrome extension** OAuth client and set **Item ID** to your extension ID exactly. Delete duplicate Chrome extension clients in GCP.

> **Never commit or ship `client_secret*.json` or `VITE_GOOGLE_WEB_CLIENT_SECRET` in the store ZIP.** Use `npm run pack:store` — it refuses to build if a secret is in the environment.

### "Google hasn't verified this app" — how to remove it for all users

BlinkOTP **cannot hide this screen in code**. Google shows it when:

- The OAuth app uses a **sensitive/restricted scope** (`gmail.readonly`), and
- The app is **not verified** (or still in **Testing**).

| Mode | Who can sign in | Unverified warning |
|------|-----------------|--------------------|
| **Testing** | Only emails listed under **Test users** (max 100) | Yes — developers click **Continue** |
| **In production, not verified** | Any Google account | Yes — scarier for users |
| **In production, verified** | Any Google account | No (normal consent only) |

**What you need for normal users (no "Continue" warning):**

1. **OAuth consent screen** → complete App information:
   - App name, support email, **App logo**
   - **Application home page** (e.g. simple site or GitHub Pages)
   - **Privacy policy URL** (public — use `docs/PRIVACY_POLICY.md` hosted online)
2. **Data access** → `gmail.readonly` added with justification: read-only access to detect OTP emails.
3. **Publish app** → change publishing status from **Testing** to **In production**.
4. **Verification Center** → submit for **Google OAuth verification** (free, but review takes days/weeks):
   - Explain: Chrome extension reads only recent verification emails to autofill OTP; no send/delete; no server storage.
   - You may need a short demo video and answers about data use (see [Google verification FAQ](https://support.google.com/cloud/answer/9110914)).
5. After **approved**, new users see the standard permission screen only (allow/deny), not the unverified-app block.

**Until verification is approved:**

- Keep **Testing** and add each beta tester under **Test users** — they can use **Continue**, but this does **not** scale to the public.
- Do **not** expect a code change in BlinkOTP to skip this — Google enforces it.

**Costs:** Verification is **free** (no Google fee). Only the one-time Chrome Web Store developer fee ($5) is separate.

## 2. Build & load locally

```bash
npm install
npm run icons
npm run build
```

Chrome → `chrome://extensions` → Developer mode → **Load unpacked** → `dist/`

## 3. Chrome Web Store developer account

1. Register at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) ($5 one-time).
2. Build & pack: `npm run pack:store` → upload `blinkotp-store.zip` (contents of `dist/`, not the repo).
3. Fill listing using [CHROME_WEB_STORE.md](./CHROME_WEB_STORE.md).
4. Attach privacy policy URL and justify `gmail.readonly` + host permissions in the review notes (see SECURITY.md).

## 4. Incognito

Users enable manually: extension details → **Allow in incognito**. BlinkOTP uses `incognito: split` so private windows do not share storage with normal browsing.

## 5. Updating OAuth extension ID

Each unpublished load generates a new extension ID unless you pack with a fixed key. For production, use a consistent **private key** (.pem) when packing, or publish through the store (stable ID).

## 6. Checklist before submit

- [ ] OAuth client IDs configured
- [ ] Privacy policy hosted publicly
- [ ] Icons 16/32/48/128 present in `public/icons/`
- [ ] `npm run build` succeeds
- [ ] Manual tests from [TESTING.md](./TESTING.md)
- [ ] No analytics SDKs in bundle
- [ ] Single purpose description matches OTP autofill
