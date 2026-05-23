# BlinkOTP Privacy Policy

**Last updated:** May 23, 2026

BlinkOTP ("we", "the extension") is designed so that **your verification codes and email access tokens never leave your device** except to communicate directly with Google Gmail over HTTPS.

## What we collect

**Nothing on our servers** — BlinkOTP does not operate backend servers and does not receive, store, or process your personal data centrally.

Data processed **locally in your browser** includes:

- OAuth access tokens for connected email accounts (encrypted in `chrome.storage.local`)
- Up to five recent OTP codes in local history (encrypted, auto-deleted after 24 hours)
- Extension settings (theme, toggles, connected account metadata)

## What we do not do

- No analytics, telemetry, fingerprinting, or advertising
- No sale or sharing of personal data with third parties
- No cloud sync of OTPs or email content
- No remote logging of page content or form fields

## Email access

With your explicit consent during setup, BlinkOTP requests **read-only** access to your Gmail mailbox via Gmail API (`gmail.readonly`).

The extension queries only recent messages matching verification-related keywords and extracts OTP codes locally. It does not send email bodies to any third-party service controlled by the extension author.

## Legal basis (GDPR)

For users in the EEA/UK, processing is based on **your consent** (connecting an account) and **legitimate interest** in providing the autofill functionality you requested. You may withdraw consent by disconnecting accounts or uninstalling the extension.

## Data retention

- OTP history: maximum 5 entries, deleted after 24 hours
- Tokens: removed when you disconnect an account or uninstall
- Incognito sessions: isolated (`split` mode); no persistence of incognito session data into normal profile storage

## Security

Sensitive values are encrypted at rest using AES-GCM via the Web Cryptography API. See [SECURITY.md](./SECURITY.md).

## Children's privacy

BlinkOTP is not directed at children under 16.

## Changes

Material changes to this policy will be reflected in extension release notes and an updated "Last updated" date.

## Contact

Privacy questions: use the [public privacy policy](https://github.com/YOUR_USERNAME/blinkotp/blob/main/docs/privacy.html) hosted on GitHub Pages, or open an issue on the project repository. Replace `YOUR_USERNAME` after you enable Pages (see `docs/GITHUB_PAGES.md`).
