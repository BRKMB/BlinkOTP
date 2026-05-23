import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ButtonContent } from './IconTooltip';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
  fullWidth?: boolean;
  loading?: boolean;
  size?: 'default' | 'large';
}

export function GradientButton({
  children,
  icon,
  variant = 'primary',
  fullWidth,
  loading,
  size = 'default',
  className = '',
  disabled,
  ...rest
}: Props) {
  const width = fullWidth ? 'w-full' : '';
  const radius = 'blink-rounded-md';
  const isDisabled = disabled || loading;
  const text = size === 'large' ? 'text-[15px]' : 'text-sm';

  if (variant === 'glass') {
    return (
      <div className={`blink-cta-glass-wrap ${width}`}>
        <button
          type="button"
          disabled={isDisabled}
          className={`blink-btn-glass-cta ${text} ${className}`.trim()}
          {...rest}
        >
          <ButtonContent
            icon={loading ? <span className="blink-spinner" aria-hidden /> : icon}
          >
            {children}
          </ButtonContent>
        </button>
      </div>
    );
  }

  const py = size === 'large' ? 'py-3' : 'py-2.5';

  if (variant === 'primary') {
    return (
      <button
        type="button"
        disabled={isDisabled}
        className={`${width} ${radius} relative overflow-hidden px-4 ${py} ${text} font-semibold tracking-tight border-0 cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed blink-btn-primary ${className}`}
        {...rest}
      >
        <ButtonContent
          icon={loading ? <span className="blink-spinner" aria-hidden /> : icon}
        >
          {children}
        </ButtonContent>
      </button>
    );
  }
  if (variant === 'secondary') {
    return (
      <button
        type="button"
        disabled={isDisabled}
        className={`${width} ${radius} px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors disabled:opacity-50 blink-btn-secondary ${className}`}
        {...rest}
      >
        <ButtonContent
          icon={
            loading ? (
              <span
                className="blink-spinner border-[var(--blink-muted)] border-t-[var(--blink-text)]"
                aria-hidden
              />
            ) : (
              icon
            )
          }
        >
          {children}
        </ButtonContent>
      </button>
    );
  }
  return (
    <button
      type="button"
      disabled={disabled}
      className={`${width} text-sm font-medium bg-transparent border-0 cursor-pointer p-0 hover:opacity-80 disabled:opacity-50 ${className}`}
      style={{ color: 'var(--blink-accent)' }}
      {...rest}
    >
      <ButtonContent icon={icon}>{children}</ButtonContent>
    </button>
  );
}
