import { secretMask } from '../../shared/storage';
import type { OtpResult } from '../../shared/types';

/** Sample OTP for settings preview and in-tab test mode (no Gmail fetch). */
export function buildPreviewOtpResult(): OtpResult {
  const code = '847293';
  return {
    code,
    confidence: 1,
    maskedCode: secretMask(code),
    email: {
      id: 'preview',
      accountId: 'preview',
      subject: 'Your verification code',
      from: 'GitHub <noreply@github.com>',
      fromDomain: 'github.com',
      snippet: `${code} is your verification code`,
      bodyText: '',
      receivedAt: Date.now(),
      candidates: [],
      bestCode: code,
      bestConfidence: 1,
    },
  };
}
