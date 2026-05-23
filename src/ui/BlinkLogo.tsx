import { getLogoUrl } from '../shared/logo-url';

interface Props {
  size?: number;
  className?: string;
  alt?: string;
}

/** Renders `public/brand/logo.png` — swap that file to update popup, options, and in-page UI. */
export function BlinkLogo({ size = 40, className = '', alt = 'BlinkOTP' }: Props) {
  return (
    <img
      src={getLogoUrl()}
      width={size}
      height={size}
      alt={alt}
      className={`shrink-0 object-contain ${className}`}
      draggable={false}
    />
  );
}
