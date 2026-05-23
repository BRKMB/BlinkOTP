import { BRAND_CSS_BLOCK } from '../../shared/brand-tokens';

const FONT_BASE = `font-family: 'Noto Sans', system-ui, -apple-system, sans-serif; ${BRAND_CSS_BLOCK}`;

const DARK_THEME_VARS = `
  --blink-text: #f4f4f5;
  --blink-muted: #a1a1aa;
  --blink-border: rgba(167, 139, 250, 0.22);
  --blink-success: #34d399;
  --blink-danger: #f87171;
  --toast-surface: rgba(6, 6, 14, 0.72);
  --toast-border: rgba(167, 139, 250, 0.22);
  --toast-shadow: 0 0 0 1px rgba(34, 211, 238, 0.08) inset, 0 0 40px rgba(147, 51, 234, 0.15), 0 20px 50px rgba(0, 0, 0, 0.5);
  --toast-wait-shadow: 0 0 0 1px rgba(255, 255, 255, 0.04) inset, 0 16px 40px rgba(0, 0, 0, 0.45);
  --toast-overlay: linear-gradient(135deg, rgba(147, 51, 234, 0.35) 0%, rgba(99, 102, 241, 0.25) 50%, rgba(6, 182, 212, 0.2) 100%);
  --toast-brand-shadow: 0 1px 3px rgba(0, 0, 0, 0.55), 0 0 18px rgba(255, 255, 255, 0.08);
  --toast-logo-shadow: 0 4px 16px rgba(147, 51, 234, 0.35);
  --toast-divider: rgba(255, 255, 255, 0.06);
  --toast-slot-bg: rgba(255, 255, 255, 0.04);
  --toast-slot-border: rgba(255, 255, 255, 0.1);
  --toast-slot-bg-dim: rgba(255, 255, 255, 0.03);
  --toast-slot-border-active: rgba(103, 232, 249, 0.5);
  --toast-slot-bg-active: rgba(34, 211, 238, 0.1);
  --toast-slot-glow: 0 0 12px rgba(34, 211, 238, 0.15);
  --toast-fallback-bg: rgba(255, 255, 255, 0.04);
  --toast-fallback-border: rgba(255, 255, 255, 0.1);
  --toast-fallback-text: rgba(228, 228, 231, 0.72);
  --toast-fallback-hover-bg: rgba(255, 255, 255, 0.07);
  --toast-fallback-hover-text: rgba(244, 244, 245, 0.9);
  --toast-progress-track: rgba(255, 255, 255, 0.08);
  --toast-btn-secondary-bg: rgba(255, 255, 255, 0.08);
  --toast-btn-secondary-border: rgba(167, 139, 250, 0.28);
  --toast-btn-secondary-text: #f4f4f5;
  --bubble-bg: rgba(0, 0, 0, 0.45);
  --bubble-border: rgba(255, 255, 255, 0.12);
  --bubble-shadow: 0 4px 14px rgba(99, 102, 241, 0.28);
  --bubble-tip-bg: #12121c;
  --bubble-tip-border: rgba(167, 139, 250, 0.35);
`;

const LIGHT_THEME_VARS = `
  --blink-text: #111118;
  --blink-muted: #5b6170;
  --blink-border: rgba(99, 102, 241, 0.22);
  --blink-success: #059669;
  --blink-danger: #dc2626;
  --toast-surface: rgba(255, 255, 255, 0.94);
  --toast-border: rgba(99, 102, 241, 0.2);
  --toast-shadow: 0 0 0 1px rgba(99, 102, 241, 0.06) inset, 0 8px 32px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(15, 23, 42, 0.06);
  --toast-wait-shadow: 0 0 0 1px rgba(99, 102, 241, 0.05) inset, 0 8px 28px rgba(15, 23, 42, 0.1);
  --toast-overlay: linear-gradient(135deg, rgba(147, 51, 234, 0.08) 0%, rgba(99, 102, 241, 0.06) 50%, rgba(6, 182, 212, 0.05) 100%);
  --toast-brand-shadow: none;
  --toast-logo-shadow: 0 2px 10px rgba(99, 102, 241, 0.2);
  --toast-divider: rgba(15, 23, 42, 0.08);
  --toast-slot-bg: rgba(15, 23, 42, 0.04);
  --toast-slot-border: rgba(15, 23, 42, 0.12);
  --toast-slot-bg-dim: rgba(15, 23, 42, 0.03);
  --toast-slot-border-active: rgba(99, 102, 241, 0.45);
  --toast-slot-bg-active: rgba(99, 102, 241, 0.08);
  --toast-slot-glow: 0 0 10px rgba(99, 102, 241, 0.12);
  --toast-fallback-bg: rgba(15, 23, 42, 0.03);
  --toast-fallback-border: rgba(15, 23, 42, 0.1);
  --toast-fallback-text: #5b6170;
  --toast-fallback-hover-bg: rgba(15, 23, 42, 0.05);
  --toast-fallback-hover-text: #111118;
  --toast-progress-track: rgba(15, 23, 42, 0.08);
  --toast-btn-secondary-bg: rgba(255, 255, 255, 0.92);
  --toast-btn-secondary-border: rgba(99, 102, 241, 0.32);
  --toast-btn-secondary-text: #1f2937;
  --bubble-bg: rgba(255, 255, 255, 0.92);
  --bubble-border: rgba(99, 102, 241, 0.22);
  --bubble-shadow: 0 4px 14px rgba(99, 102, 241, 0.15);
  --bubble-tip-bg: #ffffff;
  --bubble-tip-border: rgba(99, 102, 241, 0.28);
`;

function themeScopeBlocks(selectors: string): string {
  return `
  ${selectors}[data-theme='dark'],
  ${selectors}:not([data-theme]) {
    ${FONT_BASE}
    ${DARK_THEME_VARS}
  }
  ${selectors}[data-theme='light'] {
    ${FONT_BASE}
    ${LIGHT_THEME_VARS}
  }`;
}

const PAGE_TOAST_RULES = `
  .blink-glass-toast {
    position: relative;
    overflow: hidden;
    background: var(--toast-surface);
    backdrop-filter: blur(22px) saturate(1.5);
    -webkit-backdrop-filter: blur(22px) saturate(1.5);
    border: 1px solid var(--toast-border);
    border-radius: 18px;
    box-shadow: var(--toast-shadow);
    color: var(--blink-text);
  }
  .blink-glass-toast::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: var(--toast-overlay);
    opacity: 0.55;
  }
  .blink-code-display {
    font-variant-numeric: tabular-nums;
  }
  .blink-toast-brand {
    font-size: 13px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.02em;
    text-transform: none;
    color: var(--blink-text);
    text-shadow: var(--toast-brand-shadow);
  }
  .blink-toast-brand--compact {
    font-size: 12px;
    font-weight: 700;
  }
  .blink-glass-toast--compact {
    border-radius: 14px;
  }
  .blink-glass-toast--waiting {
    box-shadow: var(--toast-wait-shadow);
  }
  .blink-toast-header {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    position: relative;
    z-index: 1;
  }
  .blink-toast-header__text {
    flex: 1;
    min-width: 0;
  }
  .blink-toast-logo {
    border-radius: 10px;
    object-fit: contain;
    box-shadow: var(--toast-logo-shadow);
    flex-shrink: 0;
  }
  .blink-toast-subtitle {
    font-size: 11px;
    font-weight: 500;
    margin-top: 1px;
    color: var(--blink-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .blink-toast-header--wait {
    margin-bottom: 4px;
    gap: 10px;
  }
  .blink-toast-logo--lg {
    width: 40px;
    height: 40px;
    border-radius: 11px;
  }
  .blink-toast-brand--title {
    flex: 1;
    min-width: 0;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.02em;
    text-transform: none;
    color: var(--blink-text);
    text-shadow: none;
  }
  .blink-toast-close {
    background: transparent;
    border: none;
    color: var(--blink-muted);
    cursor: pointer;
    font-size: 17px;
    line-height: 1;
    padding: 0;
    margin: -2px -2px 0 0;
    flex-shrink: 0;
    align-self: flex-start;
  }
  .blink-toast-close:hover {
    color: var(--blink-text);
  }
  .blink-toast-warn {
    margin-bottom: 8px;
    padding: 8px 10px;
    border-radius: 8px;
    background: rgba(245, 158, 11, 0.12);
    border: 1px solid rgba(245, 158, 11, 0.25);
    color: #fcd34d;
    font-size: 11px;
    line-height: 1.4;
    position: relative;
    z-index: 1;
  }
  .blink-wait-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    z-index: 1;
    padding: 8px 0 2px;
    width: 100%;
  }
  .blink-otp-wait {
    display: flex;
    justify-content: center;
    width: 100%;
    margin: 4px 0 16px;
  }
  .blink-otp-wait__slots {
    display: flex;
    gap: 6px;
    align-items: center;
    justify-content: center;
  }
  .blink-otp-wait__slot {
    width: 28px;
    height: 34px;
    border-radius: 8px;
    background: var(--toast-slot-bg);
    border: 1px solid var(--toast-slot-border);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
    animation: blink-otp-slot-pulse 1.35s ease-in-out infinite;
  }
  @keyframes blink-otp-slot-pulse {
    0%, 100% {
      opacity: 0.45;
      border-color: var(--toast-slot-border);
      background: var(--toast-slot-bg-dim);
      transform: translateY(0);
      box-shadow: none;
    }
    50% {
      opacity: 1;
      border-color: var(--toast-slot-border-active);
      background: var(--toast-slot-bg-active);
      transform: translateY(-1px);
      box-shadow: var(--toast-slot-glow);
    }
  }
  .blink-wait-title {
    margin: 0;
    max-width: 220px;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.35;
    letter-spacing: -0.01em;
    color: var(--blink-text);
    text-align: center;
  }
  .blink-wait-timing {
    margin: 6px 0 0;
    font-size: 11px;
    font-weight: 500;
    color: var(--blink-muted);
    text-align: center;
  }
  .blink-toast-hint {
    font-size: 9px;
    color: var(--blink-muted);
    text-align: center;
    margin: 2px 0 0;
    line-height: 1.4;
    position: relative;
    z-index: 1;
  }
  .blink-toast-fallback {
    width: 100%;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--toast-divider);
    position: relative;
    z-index: 1;
  }
  .blink-toast-fallback__btn {
    display: block;
    width: 100%;
    padding: 7px 10px;
    border-radius: 8px;
    border: 1px solid var(--toast-fallback-border);
    background: var(--toast-fallback-bg);
    color: var(--toast-fallback-text);
    font-size: 11px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition:
      background 0.15s ease,
      color 0.15s ease,
      border-color 0.15s ease;
  }
  .blink-toast-fallback__btn:hover {
    background: var(--toast-fallback-hover-bg);
    color: var(--toast-fallback-hover-text);
    border-color: var(--blink-border);
  }
  .blink-toast-fallback__btn:active {
    transform: scale(0.99);
  }
  .blink-toast-actions {
    display: flex;
    gap: 6px;
    margin-top: 10px;
    position: relative;
    z-index: 1;
  }
  .blink-toast-btn {
    flex: 1;
    padding: 8px 10px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
    transition: opacity 0.15s ease, background 0.15s ease, border-color 0.15s ease;
  }
  .blink-toast-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .blink-toast-btn--primary {
    border: none;
    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #06b6d4 100%);
    color: #fff;
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.28);
  }
  .blink-toast-btn--primary:not(:disabled):hover {
    box-shadow: 0 4px 18px rgba(99, 102, 241, 0.38);
  }
  .blink-toast-btn--secondary {
    border: 1px solid var(--toast-btn-secondary-border);
    background: var(--toast-btn-secondary-bg);
    color: var(--toast-btn-secondary-text);
    box-shadow: none;
  }
  .blink-toast-btn--secondary:not(:disabled):hover {
    border-color: var(--blink-border);
    filter: brightness(0.98);
  }
  .blink-toast-progress {
    margin-top: 8px;
    height: 2px;
    border-radius: 99px;
    background: var(--toast-progress-track);
    overflow: hidden;
    position: relative;
    z-index: 1;
  }
  .blink-toast-progress__fill {
    height: 100%;
    background: linear-gradient(135deg, #8b5cf6, #6366f1);
    transition: width 50ms linear;
  }
  .blink-field-bubble {
    border: 1px solid var(--bubble-border);
    background: transparent;
    box-shadow: none;
    cursor: pointer;
    display: grid;
    place-items: center;
    padding: 0;
    opacity: 1;
    position: relative;
  }
  .blink-field-bubble__inner {
    width: 100%;
    height: 100%;
    border-radius: inherit;
    border: 1px solid var(--bubble-border);
    background: var(--bubble-bg);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: var(--bubble-shadow);
    display: grid;
    place-items: center;
    opacity: 0.7;
    transition: opacity 0.12s ease;
  }
  .blink-field-bubble:hover .blink-field-bubble__inner,
  .blink-field-bubble:focus-visible .blink-field-bubble__inner {
    opacity: 0.92;
  }
  .blink-field-bubble__logo {
    object-fit: contain;
    display: block;
    pointer-events: none;
  }
  .blink-field-bubble--loading .blink-field-bubble__logo {
    animation: blink-bubble-pulse 1.1s ease-in-out infinite;
  }
  .blink-field-bubble--error .blink-field-bubble__inner {
    border-color: rgba(248, 113, 113, 0.55);
  }
  @keyframes blink-bubble-pulse {
    0%, 100% { opacity: 0.55; }
    50% { opacity: 1; }
  }
  .blink-field-bubble__tip {
    position: absolute;
    bottom: calc(100% + 4px);
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.01em;
    white-space: nowrap;
    pointer-events: none;
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.12s ease, visibility 0.12s ease;
    background: var(--bubble-tip-bg);
    border: 1px solid var(--bubble-tip-border);
    color: var(--blink-text);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
    z-index: 2;
  }
  .blink-field-bubble__tip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: var(--bubble-tip-bg);
    filter: drop-shadow(0 1px 0 var(--bubble-tip-border));
  }
  .blink-field-bubble:hover .blink-field-bubble__tip,
  .blink-field-bubble:focus-visible .blink-field-bubble__tip {
    opacity: 1;
    visibility: visible;
  }
  .blink-toast-error {
    color: var(--blink-danger);
  }
  .blink-toast-success {
    color: var(--blink-success);
  }
`;

export const PAGE_TOAST_FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');`;

/** Injected into the content-script shadow root. */
export const PAGE_TOAST_SHADOW_CSS = `
  ${PAGE_TOAST_FONT_IMPORT}
  ${themeScopeBlocks(':host, #blinkotp-app')}
  ${PAGE_TOAST_RULES}
`;

/** Injected into the options-page preview frame. */
export const PAGE_TOAST_PREVIEW_CSS = `
  ${PAGE_TOAST_FONT_IMPORT}
  ${themeScopeBlocks('.blink-page-toast-preview-root')}
  ${PAGE_TOAST_RULES}
`;
