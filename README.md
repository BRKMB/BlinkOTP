# BlinkOTP

Privacy-first Chrome extension that detects OTP fields on any website and automatically fills the latest verification code from Gmail — zero backend, no telemetry.

## Quick start (development)

```bash
cd blinkotp
npm install
cp .env.example .env.local   # add OAuth client IDs (see docs/OWNER_SETUP.md)
npm run icons
npm run build
```

Load unpacked extension in Chrome: `chrome://extensions` → Developer mode → **Load unpacked** → select the `dist/` folder.

## Folder structure

```
blinkotp/
├── manifest.config.ts      # MV3 manifest (CRXJS)
├── vite.config.ts
├── public/icons/           # Extension icons (16–128px)
├── scripts/
│   ├── generate-icons.mjs
│   └── otp-extractor.test.mjs
├── src/
│   ├── background/         # Service worker (email fetch, routing)
│   ├── content/            # OTP detection, fill engine, in-page UI
│   │   ├── detector.ts
│   │   ├── filler.ts
│   │   └── ui/             # Shadow DOM React UI (bubble + notification)
│   ├── email/              # Gmail provider
│   ├── popup/              # Toolbar popup (onboarding)
│   ├── options/            # Full settings page
│   ├── shared/             # Types, crypto, storage, OTP extraction
│   ├── stores/             # Zustand state
│   └── styles/             # Tailwind + CSS variables
├── docs/                   # Policies, store copy, guides
└── dist/                   # Production build output
```

## Documentation

| Document | Purpose |
|----------|---------|
| [docs/OWNER_SETUP.md](docs/OWNER_SETUP.md) | OAuth, Chrome Web Store, publishing |
| [docs/USER_GUIDE.md](docs/USER_GUIDE.md) | End-user install & onboarding |
| [docs/SECURITY.md](docs/SECURITY.md) | Security architecture |
| [docs/PRIVACY_POLICY.md](docs/PRIVACY_POLICY.md) | Privacy policy (store listing) |
| [docs/TERMS_OF_SERVICE.md](docs/TERMS_OF_SERVICE.md) | Terms of service |
| [docs/TESTING.md](docs/TESTING.md) | QA test cases |
| [docs/CHROME_WEB_STORE.md](docs/CHROME_WEB_STORE.md) | Listing copy & screenshot specs |
| [docs/PROMO_GRAPHICS.md](docs/PROMO_GRAPHICS.md) | Promotional asset specs |

## Architecture (summary)

- **No backend**: OAuth tokens and OTP history live only in `chrome.storage.local`, encrypted with AES-GCM (Web Crypto).
- **Email**: Gmail via `chrome.identity` + Gmail API (read-only).
- **Detection**: Content script + debounced `MutationObserver`, scoring heuristics for single and split OTP inputs.
- **Fill**: Native value setter + synthetic events; paste simulation for split boxes.
- **UI**: React 18 in closed Shadow DOM (no CSS leakage), Framer Motion micro-animations.

## Keyboard shortcuts

- `Ctrl/Cmd + Shift + O` — Fetch latest OTP
- `Ctrl/Cmd + Shift + U` — Fill latest OTP into focused field

## License

MIT — free for end users; no paid tiers or telemetry by design.
