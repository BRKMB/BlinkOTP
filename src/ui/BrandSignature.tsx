import { BRAND } from '../shared/brand';

/** One signature per screen — parent must not render twice */
export function BrandSignature({
  className = '',
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <footer
      className={`flex justify-center ${compact ? '' : 'pt-4 mt-auto'} ${className}`.trim()}
    >
      <button
        type="button"
        className="blink-link-footer"
        onClick={() => chrome.tabs.create({ url: BRAND.creatorUrl })}
      >
        <span>Made by</span>
        <strong>{BRAND.creator}</strong>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="opacity-50"
        >
          <path
            d="M7 17 17 7M9 7h8v8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </footer>
  );
}
