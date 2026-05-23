export const PAGE_TOAST_DURATION_DEFAULT_SEC = 12;
export const PAGE_TOAST_DURATION_MIN_SEC = 5;
export const PAGE_TOAST_DURATION_MAX_SEC = 60;

export function clampPageToastDurationSec(value: number | undefined): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return PAGE_TOAST_DURATION_DEFAULT_SEC;
  return Math.min(
    PAGE_TOAST_DURATION_MAX_SEC,
    Math.max(PAGE_TOAST_DURATION_MIN_SEC, Math.round(n)),
  );
}

export function pageToastDurationMs(sec: number | undefined): number {
  return clampPageToastDurationSec(sec) * 1000;
}
