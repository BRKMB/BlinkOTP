# BlinkOTP — Unified logo guide

One design, two places. Replace files (same names), then:

```bash
npm run icons:brand
npm run build
```

Reload the extension at `chrome://extensions`.

## Files that matter

| File | Purpose |
|------|---------|
| **`public/brand/logo.png`** | Master logo — popup, settings, notifications, bubble |
| `public/icons/icon-16.png` | Toolbar |
| `public/icons/icon-32.png` | Toolbar / Windows |
| `public/icons/icon-48.png` | Extensions page |
| `public/icons/icon-128.png` | Chrome Web Store & Google OAuth |

After updating `logo.png`, regenerate toolbar sizes:

```bash
npm run icons:brand
```

**Do not run** `npm run icons` — it overwrites your icons with auto-generated art.

## Tips

- Square PNG, **512×512** or larger, transparent or dark background.
- Keep the graphic **large inside the square** so 16×16 stays readable.
- Optional: upload `icon-128.png` to Google Cloud → OAuth consent screen → App logo.
