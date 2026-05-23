# BlinkOTP Security Architecture

## Threat model

BlinkOTP assumes:

- The user's machine and Chrome profile are trusted
- Email providers (Google, Microsoft) are trusted over TLS
- Malicious sites may try to trick users into filling wrong codes

BlinkOTP does **not** assume trust in arbitrary page scripts (content UI runs in Shadow DOM; no secrets in page context).

## Data flow

```
Website OTP field ← content script (fill only)
        ↑
   chrome.runtime messages (code string only, no refresh tokens in content scripts)
        ↑
 Service worker ← Gmail API / Microsoft Graph (HTTPS)
        ↑
 chrome.storage.local (encrypted tokens & history)
```

No author-operated server exists in this architecture.

## Credential storage

| Asset | Location | Protection |
|-------|----------|------------|
| OAuth access tokens | `chrome.storage.local` | AES-GCM encrypted blob per account |
| Master encryption key | `chrome.storage.local` | Generated on first run via Web Crypto |
| OTP history (5 max) | `chrome.storage.local` | Encrypted fields; 24h TTL |
| Settings | `chrome.storage.local` | Non-secret preferences |

Tokens are never written to `window`, `localStorage`, or page DOM.

## Email access scope

- **Gmail**: `gmail.readonly` — list/read messages only; no send or delete
- **Outlook**: `Mail.Read` delegated via Microsoft Graph

Queries are constrained to ~24h window and verification keyword filters server-side (Gmail query / Graph `$filter`).

## OTP extraction safety

Scoring rejects common false positives (phone numbers, years, order IDs, placeholder codes). Domain mismatch warnings block **silent** auto-fill; user confirmation required.

## Content script isolation

- Closed Shadow DOM for all injected UI
- No inline eval; MV3 CSP defaults
- Minimal permissions: no `<all_urls>` cookie access; `activeTab` pattern where possible for future tightening

## Incognito

`incognito: split` — separate extension instance; no bleed of incognito OTP history into normal profile.

## Supply chain

- No third-party analytics SDKs
- Dependencies audited via `npm audit` before release
- Reproducible builds from tagged source

## Chrome Web Store review

Declare:

- Single purpose: OTP autofill from user email
- Justification for `identity`, `storage`, Gmail/Graph host permissions
- Link to this document and PRIVACY_POLICY.md

## Incident response

Because no central data exists, incidents are limited to:

1. Revoke OAuth client in Google/Microsoft console
2. Publish updated extension removing vulnerable code
3. Users refresh via Chrome auto-update

## Recommendations for users

- Enable screen lock on device
- Review domain warnings before filling
- Disconnect unused accounts in settings
