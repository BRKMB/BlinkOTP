import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { BRAND } from '../../shared/brand';

const ALERT_POSITION: React.CSSProperties = {
  position: 'fixed',
  top: 16,
  right: 16,
  left: 'auto',
  width: 320,
  maxWidth: 'calc(100vw - 32px)',
  zIndex: 2147483647,
};

interface Props {
  message: string;
  dismissAfterMs?: number;
  onDismiss: () => void;
}

export function PageAlert({ message, dismissAfterMs = 10_000, onDismiss }: Props) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = Math.max(4000, dismissAfterMs);
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.max(0, 100 - (elapsed / duration) * 100));
      if (elapsed >= duration) onDismiss();
    }, 50);
    return () => clearInterval(tick);
  }, [dismissAfterMs, onDismiss]);

  return (
    <AnimatePresence>
      <motion.div
        key="page-alert"
        role="alert"
        initial={{ opacity: 0, x: 12, scale: 0.98 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 8, scale: 0.98 }}
        transition={{ duration: 0.18 }}
        className="blink-glass-toast blink-page-alert"
        style={{
          ...ALERT_POSITION,
          padding: '10px 12px 8px',
          color: 'var(--blink-text)',
          fontFamily: 'var(--font-sans, "Noto Sans", system-ui, sans-serif)',
        }}
      >
        <div className="blink-page-alert__row">
          <span className="blink-page-alert__brand">{BRAND.name}</span>
          <button
            type="button"
            className="blink-toast-close blink-page-alert__close"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
        <p className="blink-page-alert__message">{message}</p>
        <div className="blink-toast-progress blink-page-alert__progress">
          <div className="blink-toast-progress__fill" style={{ width: `${progress}%` }} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
