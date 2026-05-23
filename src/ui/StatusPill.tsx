type Tone = 'ok' | 'warn' | 'danger';

const CLASS: Record<Tone, string> = {
  ok: 'blink-status-pill blink-status-pill--ok',
  warn: 'blink-status-pill blink-status-pill--warn',
  danger: 'blink-status-pill blink-status-pill--danger',
};

export function StatusPill({ tone, children }: { tone: Tone; children: string }) {
  return <p className={`${CLASS[tone]} m-0`}>{children}</p>;
}
