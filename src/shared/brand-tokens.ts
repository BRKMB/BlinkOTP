/** Logo-aligned palette — purple → indigo → blue → cyan */
export const BRAND_GRADIENT =
  'linear-gradient(135deg, #9333ea 0%, #7c3aed 22%, #6366f1 45%, #2563eb 72%, #06b6d4 100%)';

export const BRAND_GRADIENT_SOFT =
  'linear-gradient(135deg, rgba(147,51,234,0.45) 0%, rgba(99,102,241,0.35) 50%, rgba(6,182,212,0.28) 100%)';

/** CSS custom properties injected in popup, options, and content shadow */
export const BRAND_CSS_BLOCK = `
  --blink-gradient: ${BRAND_GRADIENT};
  --blink-gradient-soft: ${BRAND_GRADIENT_SOFT};
  --blink-accent: #a78bfa;
  --blink-accent-muted: rgba(167, 139, 250, 0.45);
  --blink-cyan: #22d3ee;
  --blink-green-glow: rgba(34, 211, 238, 0.22);
  --blink-purple-glow: rgba(147, 51, 234, 0.28);
`;
