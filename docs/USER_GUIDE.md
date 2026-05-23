# BlinkOTP — User Guide

## Quick start

1. Click the BlinkOTP icon (purple lightning).
2. **Connect Gmail** and approve read-only inbox access.
3. Visit any site with a verification code field — a glass card appears **top-left**.
4. Tap **Fill** or **Copy**.

## Gmail only

This release supports **Gmail** only. Outlook and other providers were removed to keep the experience focused and reliable.

## One inbox per address

- The same Gmail address cannot be connected twice.
- Use **Renew access** to refresh permissions; the old connection for that address is replaced automatically.
- Google access tokens are short-lived (typically about an hour). Renew when BlinkOTP shows a badge or an amber banner — your inbox is not stored on our servers.

## On-page UI (top-left)

- **Glass card** — 50% black, blur, purple/blue accent (Apple-style glassmorphism).
- **Fill** — inserts the code into the detected field.
- **Copy** — clipboard fallback.
- **⚡ bubble** — optional shortcut beside the OTP field (toggle in Settings).

## Settings

Open from the popup or right-click the extension → Options:

- Automation (auto-fill, clipboard fallback, auto-submit, domain warning, privacy mode, bubble)
- Theme (dark / light)
- Gmail account management (renew, remove, primary)
- Local OTP history (encrypted, 24h TTL)

## Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘⇧O` / `Ctrl+Shift+O` | Fetch latest code |
| `⌘⇧U` / `Ctrl+Shift+U` | Fill on current tab |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No code found | Ensure the verification email arrived; wait a few seconds and fetch again |
| Gmail expired | Popup or Settings → **Renew access** |
| Fill does nothing | Click the field first, or use Copy |
| Wrong code | Domain warning — confirm the sender matches the site |

## Privacy

All processing is local. OAuth tokens are encrypted in `chrome.storage.local`. No BlinkOTP servers receive your mail or codes.
