# Promotional Graphics Specs

## Extension icons (required)

| Size | Path | Notes |
|------|------|-------|
| 16×16 | `public/icons/icon-16.png` | Toolbar |
| 32×32 | `public/icons/icon-32.png` | Windows |
| 48×48 | `public/icons/icon-48.png` | Extensions page |
| 128×128 | `public/icons/icon-128.png` | Store listing |

**Art direction:** Rounded square, `#5b8cff` gradient orb on near-black `#0a0a0c`, subtle highlight — minimal, not “hacker green”.

Regenerate: `npm run icons`

## Chrome Web Store marquee (optional)

- **1400×560** PNG
- Left third: logo + wordmark “BlinkOTP”
- Center/right: mock notification + OTP field bubble
- Background: `#0a0a0c` with soft blue glow (`#5b8cff` at 15% opacity)

## Small promo tile

- **440×280** PNG
- Logo centered, tagline: “OTP autofill from email”
- Same palette as icons

## Screenshot safe zones

- Keep critical UI inside center 80% (cropping on high-DPI listings)
- No real email addresses or live OTP codes — use `••••56` and `demo@example.com`

## Typography

- **Inter** or system UI stack
- Headlines 600 weight, body 400–500

## Motion (marketing video optional)

- 150–200ms fade for notification
- Spring scale 0.96 → 1 on bubble appear
