# Chrome Web Store Listing

## Short description (132 chars max)

Automatically fill OTP codes from Gmail. Private, free, no servers — works on any site in seconds.

## Detailed description

**BlinkOTP** brings one-tap OTP autofill to every website — without opening your inbox.

### Why BlinkOTP?

- **Fully automatic** — detects verification fields and fills the latest code
- **Email-native** — reads codes directly from Gmail (read-only)
- **Private by design** — no servers, no analytics, encrypted local storage only
- **Premium UX** — glass notifications, inline bubble, dark mode, privacy masking
- **Free forever** — no subscriptions, ads, or paywalls

### Features

- Smart OTP field detection (single input & split digit boxes)
- Works with React, Vue, Angular, and SPAs
- Gmail support with multi-account fallback
- Intelligent OTP extraction with false-positive filtering
- Domain mismatch warnings
- Clipboard fallback when autofill is blocked
- Optional auto-submit
- Keyboard shortcuts
- Local OTP history (encrypted, 24h retention)
- Incognito support (with permission)

### Permissions explained

- **identity** — secure OAuth login to your email provider
- **storage** — encrypted local settings and tokens only on your device
- **Gmail / Microsoft hosts** — direct HTTPS API calls; no intermediary servers

### Setup in under 2 minutes

Install → Connect Gmail → visit any site with a verification code.

---

Replace support URL and privacy policy link before submission.

## Category

Productivity

## Screenshot specifications

Provide **1280×800** or **640×400** PNG/JPEG (max 5 screenshots):

1. **Hero** — verification page with BlinkOTP bubble + notification showing masked code
2. **Onboarding** — popup with Connect Gmail
3. **Settings** — dark theme settings panel with toggles
4. **Privacy** — domain mismatch warning state
5. **Success** — filled OTP field (blur personal data)

Use subtle drop shadows, `#0a0a0c` background, accent `#5b8cff`.

## Promotional tile

See [PROMO_GRAPHICS.md](./PROMO_GRAPHICS.md).

## Single purpose statement

Read verification codes from the user's connected email inbox and autofill one-time password fields on websites the user visits.

## Permission justifications (review notes)

| Permission | Justification |
|------------|---------------|
| `identity` | OAuth for Gmail without backend |
| `storage` | Encrypted local tokens & settings |
| `gmail.readonly` | Fetch recent verification emails only |
| `<all_urls>` content script | OTP fields appear on arbitrary login domains |
| `clipboardWrite` | Fallback copy when autofill blocked |
