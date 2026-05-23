export function SectionHeading({
  children,
  statusDot,
}: {
  children: string;
  statusDot?: 'ok' | 'danger';
}) {
  return (
    <h2 className="blink-section-label">
      {statusDot ? (
        <span
          className={`blink-section-dot blink-section-dot--${statusDot}`}
          aria-hidden
        />
      ) : null}
      {children}
    </h2>
  );
}
