import type { UserSettings } from '../shared/types';
import { IconMoon, IconSun } from './icons';
import { IconTooltip } from './IconTooltip';

interface Props {
  theme: UserSettings['theme'];
  onChange: (theme: UserSettings['theme']) => void;
}

export function ThemeToggle({ theme, onChange }: Props) {
  const isDark = theme === 'dark';
  const next = isDark ? 'light' : 'dark';
  /** Icon = mode you switch to (sun → light, moon → dark). */
  const label = isDark ? 'Light mode' : 'Dark mode';

  return (
    <IconTooltip label={label}>
      <button
        type="button"
        aria-label={label}
        onClick={() => onChange(next)}
        className="blink-footer-icon-btn"
      >
        {isDark ? <IconSun size={18} strokeWidth={1.75} /> : <IconMoon size={18} strokeWidth={1.75} />}
      </button>
    </IconTooltip>
  );
}
