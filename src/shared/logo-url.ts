/** Single brand logo — replace `public/brand/logo.png` (see docs/LOGO.md). */
import logoUrl from '/brand/logo.png';

export const LOGO_URL: string = logoUrl;

export function getLogoUrl(): string {
  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    return chrome.runtime.getURL('brand/logo.png');
  }
  return LOGO_URL;
}
