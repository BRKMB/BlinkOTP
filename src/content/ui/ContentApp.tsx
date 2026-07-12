import { useCallback, useEffect, useRef, useState } from 'react';
import { sanitizeOtpCode } from '../../shared/otp-extractor';
import { secretMask } from '../../shared/storage';
import { isOtpEntryReady, type OtpFieldGroup } from '../detector';
import { pageToastDurationMs } from '../../shared/page-toast-settings';
import type { OtpResult, UserSettings } from '../../shared/types';
import {
  isPageAlertDismissed,
  markPageAlertDismissed,
  pageAlertKey,
} from '../page-alert-dismiss';
import { subscribeOtpUi } from '../content-ui-bridge';
import { Bubble } from './Bubble';
import { Notification } from './Notification';
import { PageAlert } from './PageAlert';

const TOAST_LEFT: React.CSSProperties = {
  position: 'fixed',
  top: 16,
  left: 16,
  right: 'auto',
  maxWidth: 340,
  padding: '12px 14px',
  borderRadius: 14,
  fontSize: 13,
  zIndex: 2147483647,
  fontFamily: 'var(--font-sans, "Noto Sans", system-ui, sans-serif)',
};

interface Props {
  group: OtpFieldGroup | null;
  showBubble: boolean;
  onFill: (code: string, group: OtpFieldGroup) => void;
  onFetch: () => void;
  onUseLatestCode: () => void;
}

export function ContentApp({ group, showBubble, onFill, onFetch, onUseLatestCode }: Props) {
  const [otp, setOtp] = useState<OtpResult | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [pageAlert, setPageAlert] = useState<{ message: string; key: string } | null>(null);
  const pageAlertShownRef = useRef<string | null>(null);
  const [fillHint, setFillHint] = useState<string | null>(null);
  const [bubbleState, setBubbleState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [waitingForNew, setWaitingForNew] = useState(false);
  const [toastDismissMs, setToastDismissMs] = useState(12_000);

  useEffect(() => {
    const apply = (settings: UserSettings | undefined) => {
      setToastDismissMs(pageToastDurationMs(settings?.pageToastDurationSec));
    };
    chrome.storage.local.get('blinkotp_settings', (data) => {
      apply(data.blinkotp_settings as UserSettings | undefined);
    });
    const onChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area !== 'local' || !changes.blinkotp_settings?.newValue) return;
      apply(changes.blinkotp_settings.newValue as UserSettings);
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);

  const dismissPageAlert = useCallback(async () => {
    const key = pageAlert?.key;
    if (key) {
      await markPageAlertDismissed(key);
      pageAlertShownRef.current = key;
    }
    setPageAlert(null);
  }, [pageAlert]);

  const showFetchErrorAlert = useCallback(async (error: string) => {
    const key = pageAlertKey(error);
    if (pageAlertShownRef.current === key) return;
    if (await isPageAlertDismissed(key)) return;
    pageAlertShownRef.current = key;
    setPopupOpen(false);
    setWaitingForNew(false);
    setOtp(null);
    setPageAlert({ message: error, key });
    setBubbleState('error');
  }, []);

  const dismiss = useCallback(() => {
    setOtp(null);
    setPopupOpen(false);
    setPageAlert(null);
    setFillHint(null);
    setWaitingForNew(false);
  }, []);

  const applyOtpReady = useCallback((msg: { payload?: OtpResult | null; error?: string }) => {
    setPageAlert(null);
    setWaitingForNew(false);
    setFillHint(null);
    setPopupOpen(true);
    if (msg.payload) {
      const code = sanitizeOtpCode(msg.payload.code);
      setOtp({
        ...msg.payload,
        code,
        maskedCode: secretMask(code),
      });
      setWarning(msg.error ?? null);
      setBubbleState('ready');
    } else {
      setBubbleState('error');
    }
  }, []);

  useEffect(() => {
    const onUi = subscribeOtpUi((msg) => {
      if (msg.type === 'OTP_POPUP_OPEN') {
        setPopupOpen(true);
        setBubbleState('loading');
        setWaitingForNew(Boolean(msg.waiting));
        return;
      }
      if (msg.type === 'OTP_POPUP_CLOSE') {
        dismiss();
        return;
      }
      if (msg.type === 'OTP_FETCH_STARTED') {
        setBubbleState('loading');
        if (typeof msg.waiting === 'boolean') setWaitingForNew(msg.waiting);
        return;
      }
      if (msg.type === 'OTP_WAITING_NEW') {
        setPopupOpen(true);
        setWaitingForNew(true);
        setBubbleState('loading');
        return;
      }
      if (msg.type === 'OTP_FETCH_FAILED') {
        void showFetchErrorAlert(msg.error ?? 'Could not fetch code');
        return;
      }
      if (msg.type === 'OTP_READY') {
        applyOtpReady(msg);
      }
    });

    const onRuntime = (msg: { type: string; payload?: OtpResult | null; error?: string }) => {
      if (msg.type === 'OTP_FETCH_FAILED') {
        if (
          msg.error?.includes('No new verification code') ||
          msg.error?.includes('wait a moment')
        ) {
          setPopupOpen(true);
          setWaitingForNew(true);
          setBubbleState('loading');
          return;
        }
        void showFetchErrorAlert(msg.error ?? 'Could not fetch code');
        return;
      }
      if (msg.type === 'OTP_READY') {
        applyOtpReady(msg);
      }
    };

    chrome.runtime.onMessage.addListener(onRuntime);
    return () => {
      onUi();
      chrome.runtime.onMessage.removeListener(onRuntime);
    };
  }, [dismiss, applyOtpReady, showFetchErrorAlert]);

  const copyCode = useCallback(async (code: string) => {
    await navigator.clipboard.writeText(sanitizeOtpCode(code));
  }, []);

  const handleFill = useCallback(() => {
    if (!otp) return;
    const code = sanitizeOtpCode(otp.code);
    const target = group ?? isOtpEntryReady() ?? null;

    if (otp.email.id === 'preview') {
      void copyCode(code);
      setFillHint('Preview only — code copied to clipboard');
      setTimeout(() => setFillHint(null), 3000);
      return;
    }

    if (!target) {
      void copyCode(code);
      setFillHint('No OTP field found — code copied to clipboard');
      return;
    }

    onFill(code, target);
    setFillHint('Filled — press Verify if needed');
    setTimeout(() => setFillHint(null), 3000);
  }, [otp, group, onFill, copyCode]);

  const rect = group?.elements[0]?.getBoundingClientRect();
  const showNotification = popupOpen || Boolean(otp);
  const notificationLoading = popupOpen && !otp && !pageAlert;

  return (
    <>
      {showBubble && rect && group && (
        <Bubble
          anchor={rect}
          state={bubbleState}
          onClick={() => {
            setPopupOpen(true);
            if (otp) {
              setBubbleState('ready');
              return;
            }
            setBubbleState('loading');
            onFetch();
          }}
        />
      )}
      {pageAlert && (
        <PageAlert
          message={pageAlert.message}
          dismissAfterMs={Math.min(toastDismissMs, 12_000)}
          onDismiss={() => void dismissPageAlert()}
        />
      )}
      {fillHint && (
        <div className="blink-glass-toast" style={{ ...TOAST_LEFT, color: 'var(--blink-success, #34d399)' }}>
          {fillHint}
        </div>
      )}
      {showNotification && !pageAlert && (
        <Notification
          otp={otp}
          loading={notificationLoading}
          waitingForNew={waitingForNew}
          warning={warning}
          onFill={handleFill}
          onCopy={() => otp && copyCode(otp.code)}
          onDismiss={dismiss}
          onUseLatestCode={waitingForNew ? () => onUseLatestCode() : undefined}
          dismissAfterMs={toastDismissMs}
        />
      )}
    </>
  );
}
