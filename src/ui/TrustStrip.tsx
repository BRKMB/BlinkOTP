import { IconDatabase, IconLock, IconShield } from './icons';

const ITEMS = [
  { icon: IconShield, label: 'Read-only access' },
  { icon: IconLock, label: 'Runs locally' },
  { icon: IconDatabase, label: 'No email storage' },
] as const;

export function TrustStrip() {
  return (
    <ul className="blink-trust-row" aria-label="Privacy and security">
      {ITEMS.map(({ icon: Icon, label }) => (
        <li key={label} className="blink-trust-item">
          <Icon size={12} strokeWidth={1.75} />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}
