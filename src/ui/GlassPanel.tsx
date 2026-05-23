import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  variant?: 'panel' | 'toast';
}

export function GlassPanel({ children, className = '', variant = 'panel' }: Props) {
  const base = variant === 'toast' ? 'blink-glass-toast' : 'blink-glass-panel';
  return <div className={`${base} ${className}`}>{children}</div>;
}
