import type { UserSettings } from '../shared/types';
import { BRAND } from '../shared/brand';
import { IconCoffee, IconCog } from './icons';
import { IconTooltip } from './IconTooltip';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  theme: UserSettings['theme'];
  onThemeChange: (theme: UserSettings['theme']) => void;
}

export function PopupFooter({ theme, onThemeChange }: Props) {
  return (
    <footer className="blink-popup__footer">
      <div className="blink-popup__footer-bar">
        <button
          type="button"
          className="blink-support-link"
          onClick={() => chrome.tabs.create({ url: BRAND.creatorUrl })}
        >
          <IconCoffee size={16} strokeWidth={1.75} />
          <span>Support the developers</span>
        </button>
        <div className="blink-popup__footer-actions">
          <ThemeToggle theme={theme} onChange={onThemeChange} />
          <IconTooltip label="Settings">
            <button
              type="button"
              className="blink-footer-icon-btn"
              aria-label="Settings"
              onClick={() => chrome.runtime.openOptionsPage()}
            >
              <IconCog size={18} strokeWidth={1.75} />
            </button>
          </IconTooltip>
        </div>
      </div>
    </footer>
  );
}
