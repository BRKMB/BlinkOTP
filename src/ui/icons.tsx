import type { SVGProps } from 'react';

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

function baseProps({ size = 18, className = '', ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    className: `shrink-0 ${className}`.trim(),
    'aria-hidden': rest['aria-hidden'] ?? true,
    ...rest,
  };
}

/** @deprecated Use IconVerificationCode */
export function IconFetch(props: IconProps) {
  return <IconVerificationCode {...props} />;
}

/**
 * Mail + code dots — “fetch verification code from inbox”.
 * Reads clearly at 18px; uses currentColor for theme-aware CTA tint.
 */
export function IconVerificationCode(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M4 6.5h16a1.5 1.5 0 0 1 1.5 1.5v5.75A1.5 1.5 0 0 1 20 15.25H4A1.5 1.5 0 0 1 2.5 13.75V8A1.5 1.5 0 0 1 4 6.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M4 8.25 12 12.75 20 8.25"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="18.25" r="1.35" fill="currentColor" />
      <circle cx="12" cy="18.25" r="1.35" fill="currentColor" />
      <circle cx="16" cy="18.25" r="1.35" fill="currentColor" />
    </svg>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Gear / cog — settings */
export function IconCog(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCoffee(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M6 8h12v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M18 10h1a2 2 0 0 1 0 4h-1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M7 4v2M11 4v1M15 4v2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M8 20h8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5 6.5 6.5 0 0 0 20.5 14.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSun(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 3v1.5M12 19.5V21M5.6 5.6l1.06 1.06M17.34 17.34l1.06 1.06M3 12h1.5M19.5 12H21M5.6 18.4l1.06-1.06M17.34 6.66l1.06-1.06"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconMail(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="m3 7 9 6 9 6 21 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconRefresh(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M21 12a9 9 0 1 1-2.64-6.36"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M21 3v6h-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconShield(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconLock(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M8 11V8a4 4 0 1 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconDatabase(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <ellipse cx="12" cy="5" rx="8" ry="3" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="m5 12 4 4 10-10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
