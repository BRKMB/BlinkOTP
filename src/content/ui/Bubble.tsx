import { motion } from 'framer-motion';
import { getLogoUrl } from '../../shared/logo-url';

interface Props {
  anchor: DOMRect;
  state: 'loading' | 'ready' | 'error';
  onClick: () => void;
}

const BUBBLE_SIZE = 20;
const LOGO_SIZE = 13;

export function Bubble({ anchor, state, onClick }: Props) {
  const top = anchor.top + window.scrollY - BUBBLE_SIZE - 3;
  const left = anchor.left + window.scrollX + anchor.width - BUBBLE_SIZE + 1;

  return (
    <motion.button
      type="button"
      className={`blink-field-bubble blink-field-bubble--${state}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.04 }}
      transition={{ duration: 0.16 }}
      onClick={onClick}
      aria-label="BlinkOTP"
      style={{
        position: 'absolute',
        top,
        left,
        width: BUBBLE_SIZE,
        height: BUBBLE_SIZE,
        borderRadius: 6,
        zIndex: 2147483646,
      }}
    >
      <span className="blink-field-bubble__tip">BlinkOTP</span>
      <span className="blink-field-bubble__inner">
        <img
          src={getLogoUrl()}
          alt=""
          width={LOGO_SIZE}
          height={LOGO_SIZE}
          className="blink-field-bubble__logo"
          draggable={false}
        />
      </span>
    </motion.button>
  );
}
