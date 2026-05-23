import {
  cloneElement,
  useCallback,
  useState,
  type FocusEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

interface Props {
  label: string;
  children: ReactElement<{
    onMouseEnter?: (e: MouseEvent<HTMLElement>) => void;
    onMouseLeave?: (e: MouseEvent<HTMLElement>) => void;
    onClick?: (e: MouseEvent<HTMLElement>) => void;
    onBlur?: (e: FocusEvent<HTMLElement>) => void;
  }>;
  placement?: 'top' | 'bottom';
}

/** Hover-only label for icon controls — hides on click/blur so focus does not stick the tip open. */
export function IconTooltip({ label, children, placement = 'top' }: Props) {
  const [visible, setVisible] = useState(false);

  const hide = useCallback(() => setVisible(false), []);
  const show = useCallback(() => setVisible(true), []);

  const pos =
    placement === 'top'
      ? 'bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2'
      : 'top-[calc(100%+6px)] left-1/2 -translate-x-1/2';

  const child = cloneElement(children, {
    onMouseEnter: (e: MouseEvent<HTMLElement>) => {
      children.props.onMouseEnter?.(e);
      show();
    },
    onMouseLeave: (e: MouseEvent<HTMLElement>) => {
      children.props.onMouseLeave?.(e);
      hide();
    },
    onClick: (e: MouseEvent<HTMLElement>) => {
      children.props.onClick?.(e);
      hide();
      e.currentTarget.blur();
    },
    onBlur: (e: FocusEvent<HTMLElement>) => {
      children.props.onBlur?.(e);
      hide();
    },
  });

  return (
    <span className="blink-icon-tooltip relative inline-flex">
      {child}
      <span
        role="tooltip"
        aria-hidden={!visible}
        className={`pointer-events-none absolute ${pos} z-[100] whitespace-nowrap px-2 py-1 transition-opacity duration-150 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {label}
      </span>
    </span>
  );
}

export function ButtonContent({
  icon,
  children,
}: {
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      {icon ? <span className="shrink-0 flex items-center">{icon}</span> : null}
      <span>{children}</span>
    </span>
  );
}
