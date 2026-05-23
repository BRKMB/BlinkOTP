import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { BRAND } from '../../shared/brand';
import { BRAND_GRADIENT } from '../../shared/brand-tokens';
import { getLogoUrl } from '../../shared/logo-url';
import { secretMask } from '../../shared/storage';
import type { OtpResult } from '../../shared/types';

interface Props {
  otp: OtpResult | null;
  loading?: boolean;
  waitingForNew?: boolean;
  warning?: string | null;
  onFill: () => void;
  onCopy: () => void;
  onDismiss: () => void;
  onUseLatestCode?: () => void;
  /** Auto-dismiss after code is shown (ms). Waiting state never auto-dismisses. */
  dismissAfterMs?: number;
  /** Render inside settings preview frame instead of fixed on the page. */
  embedded?: boolean;
}

const TOAST_POSITION: React.CSSProperties = {
  position: 'fixed',
  top: 12,
  left: 12,
  right: 'auto',
  width: 268,
  maxWidth: 'calc(100vw - 24px)',
  zIndex: 2147483647,
};

function senderLabel(from: string): string {
  const name = from.match(/^([^<]+)/)?.[1]?.trim();
  if (name) return name;
  const email = from.match(/<([^>]+)>/)?.[1];
  return email ?? from;
}

const OTP_SLOT_COUNT = 6;

/** Calm “code incoming” pulse — no hourglass / spinner. */
function CodeWaitIndicator() {
  return (
    <div className="blink-otp-wait" aria-hidden>
      <div className="blink-otp-wait__slots">
        {Array.from({ length: OTP_SLOT_COUNT }, (_, i) => (
          <span key={i} className="blink-otp-wait__slot" style={{ animationDelay: `${i * 0.11}s` }} />
        ))}
      </div>
    </div>
  );
}

function WaitingPanel({
  waitingForNew,
  onUseLatestCode,
}: {
  waitingForNew?: boolean;
  onUseLatestCode?: () => void;
}) {
  return (
    <div className="blink-wait-panel">
      <CodeWaitIndicator />

      <p className="blink-wait-title" role="status" aria-live="polite">
        {waitingForNew
          ? 'Waiting for your verification code'
          : 'Fetching your verification code'}
      </p>
      <p className="blink-wait-timing">
        {waitingForNew ? 'Usually within seconds' : 'This usually takes a few seconds'}
      </p>

      {waitingForNew && onUseLatestCode && (
        <div className="blink-toast-fallback">
          <button type="button" className="blink-toast-fallback__btn" onClick={onUseLatestCode}>
            Use last inbox code now
          </button>
        </div>
      )}
    </div>
  );
}

export function Notification({
  otp,
  loading = false,
  waitingForNew = false,
  warning,
  onFill,
  onCopy,
  onDismiss,
  onUseLatestCode,
  dismissAfterMs = 12_000,
  embedded = false,
}: Props) {
  const [revealed, setRevealed] = useState(false);
  const [progress, setProgress] = useState(100);

  const isWaiting = loading;
  const code = otp?.code ?? '';
  const display = revealed ? code : secretMask(code);
  const canReveal = Boolean(otp?.code) && !loading;

  useEffect(() => {
    if (loading || waitingForNew) return;
    const duration = Math.max(3000, dismissAfterMs);
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.max(0, 100 - (elapsed / duration) * 100));
      if (elapsed >= duration) onDismiss();
    }, 50);
    return () => clearInterval(tick);
  }, [loading, waitingForNew, onDismiss, dismissAfterMs]);

  useEffect(() => {
    if (otp?.code) setRevealed(false);
  }, [otp?.code]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -12, scale: 0.97 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -8, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className={`blink-glass-toast blink-glass-toast--compact${isWaiting ? ' blink-glass-toast--waiting' : ''}`}
        style={{
          ...(embedded
            ? {
                position: 'relative',
                top: 0,
                left: 0,
                width: 268,
                maxWidth: '100%',
                zIndex: 1,
              }
            : TOAST_POSITION),
          padding: isWaiting ? '10px 12px 12px' : '12px 12px 10px',
          color: 'var(--blink-text)',
          fontFamily: 'var(--font-sans, "Noto Sans", system-ui, sans-serif)',
        }}
      >
        {warning && <div className="blink-toast-warn">{warning}</div>}

        <div className={`blink-toast-header${isWaiting ? ' blink-toast-header--wait' : ''}`}>
          <img
            src={getLogoUrl()}
            alt=""
            width={isWaiting ? 40 : 32}
            height={isWaiting ? 40 : 32}
            className={`blink-toast-logo${isWaiting ? ' blink-toast-logo--lg' : ''}`}
          />
          {isWaiting ? (
            <span className="blink-toast-brand blink-toast-brand--title">{BRAND.name}</span>
          ) : (
            <div className="blink-toast-header__text">
              <div className="blink-toast-brand blink-toast-brand--compact">{BRAND.name}</div>
              <div className="blink-toast-subtitle">{senderLabel(otp!.email.from)}</div>
            </div>
          )}
          <button type="button" onClick={onDismiss} className="blink-toast-close" aria-label="Dismiss">
            ×
          </button>
        </div>

        {isWaiting ? (
          <WaitingPanel waitingForNew={waitingForNew} onUseLatestCode={onUseLatestCode} />
        ) : (
          <>
            <button
              type="button"
              onClick={() => canReveal && setRevealed((r) => !r)}
              disabled={!canReveal}
              className="blink-code-display"
              style={{
                marginTop: 10,
                width: '100%',
                fontSize: 22,
                fontWeight: 600,
                fontFamily: 'ui-monospace, monospace',
                background: revealed && canReveal ? BRAND_GRADIENT : 'transparent',
                WebkitBackgroundClip: revealed && canReveal ? 'text' : undefined,
                backgroundClip: revealed && canReveal ? 'text' : undefined,
                color: revealed && canReveal ? 'transparent' : 'var(--blink-text)',
                border: 'none',
                cursor: canReveal ? 'pointer' : 'default',
                textAlign: 'center',
                padding: '6px 0',
                letterSpacing: '0.22em',
                lineHeight: 1.2,
              }}
            >
              {display}
            </button>

            <p className="blink-toast-hint">
              {revealed ? 'Tap the code above to hide' : 'Tap the code above to reveal'}
            </p>

            <div className="blink-toast-actions">
              <button
                type="button"
                className="blink-toast-btn blink-toast-btn--primary"
                onClick={onFill}
                disabled={loading || !otp}
              >
                Fill
              </button>
              <button
                type="button"
                className="blink-toast-btn blink-toast-btn--secondary"
                onClick={onCopy}
                disabled={loading || !otp}
              >
                Copy
              </button>
            </div>

            {!loading && (
              <div className="blink-toast-progress">
                <div className="blink-toast-progress__fill" style={{ width: `${progress}%` }} />
              </div>
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
