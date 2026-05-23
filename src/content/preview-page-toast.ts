import { pushOtpToUi } from './content-ui-bridge';
import { buildPreviewOtpResult } from './ui/page-toast-preview-data';

export type PageToastPreviewMode = 'waiting' | 'ready';

/** Show the top-left page toast on the active tab (test only). */
export function previewPageToast(mode: PageToastPreviewMode): void {
  if (mode === 'waiting') {
    pushOtpToUi({ type: 'OTP_POPUP_OPEN', waiting: true });
    return;
  }
  pushOtpToUi({ type: 'OTP_READY', payload: buildPreviewOtpResult() });
}
