# GitHub Pages (public legal pages only)

These files are safe to publish — **no secrets**, no OAuth client secrets, no `.env` values:

- `index.html` — home
- `privacy.html` — privacy policy (for Google OAuth + Chrome Web Store)
- `terms.html` — terms of service

## Enable Pages

1. Push this repo to GitHub (public).
2. Repository **Settings** → **Pages**.
3. **Build and deployment** → Source: **Deploy from a branch**.
4. Branch: `main` → Folder: **`/docs`** → Save.

## URLs for Google Cloud Branding

Replace `YOUR_USERNAME` with your GitHub username:

| Field | URL |
|-------|-----|
| Application home page | `https://YOUR_USERNAME.github.io/blinkotp/` |
| Privacy policy | `https://YOUR_USERNAME.github.io/blinkotp/privacy.html` |
| Terms (optional) | `https://YOUR_USERNAME.github.io/blinkotp/terms.html` |

## Authorized domain

Add in Google Cloud → Branding:

```
YOUR_USERNAME.github.io
```

## Do not publish

Never commit: `.env.local`, `client_secret*.json`, `backups/`, `dist/` with local secrets.
