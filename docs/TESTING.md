# BlinkOTP Testing Guide

## Environment

- Chrome 120+ (or Brave / Edge Chromium)
- Test Gmail and/or Microsoft account
- Built extension: `npm run build` → load `dist/`

## Quick test playground (repeat as much as you want)

### Local page (recommended)

```bash
npm run test:page
```

Open **http://localhost:5173/otp-playground.html** — three OTP layouts (single, split, hint).

Before each run, email yourself from any account:

- **Subject:** `Your verification code`
- **Body:** `Your code is 847291` (change digits each time)

Then open the playground tab — BlinkOTP should detect fields and autofill.

### Enable extension on local / file URLs (if needed)

`brave://extensions` → BlinkOTP → **Details** → allow access to file URLs (only if you open the HTML file directly).

## External sites (real-world UI)

| Site | What to test |
|------|----------------|
| [Google WebOTP demo](https://web-otp.glitch.me/) | Browser OTP / field patterns |
| [GitHub 2FA settings](https://github.com/settings/security) | Real split-style flow (careful: real account) |
| [Stripe test mode](https://dashboard.stripe.com/test/dashboard) | Some flows send email codes in test mode |
| Any login you control | Discord, Twitter/X, Amazon — triggers real email OTP |

For **email + fill** loop without burning real signups: use **local playground + self-sent Gmail** only.

## Unit / smoke

```bash
npm run test:unit
```

## Manual test matrix

### Onboarding

| # | Case | Expected |
|---|------|----------|
| 1 | Fresh install → Connect Gmail | OAuth completes; email shown in popup |
| 2 | Connect second Outlook account | Both listed; primary selectable in settings |
| 3 | Disconnect account | Token removed; no fetch errors |

### OTP detection

| # | Site pattern | Expected |
|---|--------------|----------|
| 4 | Single `<input autocomplete="one-time-code">` | Bubble appears |
| 5 | 6-box split layout | Group detected; fill distributes digits |
| 6 | SPA lazy-rendered form | MutationObserver detects within ~200ms |
| 7 | Non-OTP numeric field (quantity) | No bubble / low confidence |

### Email & extraction

| # | Case | Expected |
|---|------|----------|
| 8 | New Gmail "Your code is 123456" | Code extracted with high confidence |
| 9 | Hyphenated `123-456` in body | Normalized to `123456` |
| 10 | Order confirmation with long IDs | No false autofill |
| 11 | Email older than 24h | Ignored |

### Autofill behavior

| # | Case | Expected |
|---|------|----------|
| 12 | React controlled input | Value visible; form accepts code |
| 13 | Split boxes | All boxes populated |
| 14 | Site blocks fill | Clipboard fallback + notification |
| 15 | Domain mismatch sender | Warning; no silent auto-fill |

### UI

| # | Case | Expected |
|---|------|----------|
| 16 | Notification | Glass popup top-right; dismiss ≤10s |
| 17 | Privacy mode | Masked until click |
| 18 | Dark/light toggle | Instant theme switch |
| 19 | `Ctrl+Shift+O` | Fetches and shows notification |
| 20 | `Ctrl+Shift+U` | Fills focused field |

### Settings & storage

| # | Case | Expected |
|---|------|----------|
| 21 | Auto-submit ON | Verify button clicked ~1s after fill |
| 22 | Clear history | History list empty |
| 23 | History TTL | Entries >24h removed on read |

### Incognito

| # | Case | Expected |
|---|------|----------|
| 24 | Allow incognito + connect | Works in incognito window |
| 25 | Close incognito | No OTP history leaked to normal profile |

### Resilience

| # | Case | Expected |
|---|------|----------|
| 26 | Airplane mode during fetch | Graceful error; retry on next visit |
| 27 | Revoked OAuth | Prompt to reconnect |

## Regression checklist before store submit

- [ ] `npm run build` clean
- [ ] Bundle size < 5 MB
- [ ] No console errors on popular login pages (Google, GitHub, Stripe test mode)
- [ ] Privacy policy URL live
