import { useEffect, useRef, useState } from 'react';
import { Notification } from '../content/ui/Notification';
import { PAGE_TOAST_PREVIEW_CSS } from '../content/ui/page-toast-styles';
import { buildPreviewOtpResult } from '../content/ui/page-toast-preview-data';
import { pageToastDurationMs } from '../shared/page-toast-settings';
import { GradientButton } from '../ui/GradientButton';

type PreviewView = 'waiting' | 'ready' | null;

interface Props {
  durationSec: number;
  theme: 'dark' | 'light';
}

export function PageToastPreviewPanel({ durationSec, theme }: Props) {
  const [view, setView] = useState<PreviewView>(null);
  const flowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissMs = pageToastDurationMs(durationSec);
  const previewOtp = buildPreviewOtpResult();

  useEffect(() => {
    return () => {
      if (flowTimerRef.current) clearTimeout(flowTimerRef.current);
    };
  }, []);

  function runFlow() {
    if (flowTimerRef.current) clearTimeout(flowTimerRef.current);
    setView('waiting');
    flowTimerRef.current = setTimeout(() => {
      setView('ready');
      flowTimerRef.current = null;
    }, 2800);
  }

  return (
    <div className="mt-5">
      <p className="text-sm font-medium m-0 mb-2">Live preview</p>
      <p className="text-xs text-[var(--blink-muted)] m-0 mb-3 leading-relaxed">
        Sample UI only — not a real code. The waiting toast has no time limit; the code toast
        uses the duration slider above.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <GradientButton variant="secondary" onClick={() => setView('waiting')}>
          Waiting state
        </GradientButton>
        <GradientButton variant="secondary" onClick={() => setView('ready')}>
          With code
        </GradientButton>
        <GradientButton variant="glass" onClick={() => runFlow()}>
          Full flow
        </GradientButton>
        {view && (
          <GradientButton variant="ghost" className="!text-[var(--blink-muted)]" onClick={() => setView(null)}>
            Hide preview
          </GradientButton>
        )}
      </div>

      <div
        className="blink-page-toast-preview-root rounded-xl border border-[var(--blink-border)] overflow-hidden"
        data-theme={theme}
        style={{
          minHeight: view ? 200 : 120,
          background: theme === 'light' ? 'rgba(236, 236, 244, 0.85)' : 'rgba(6, 6, 14, 0.55)',
          padding: view ? '16px' : '24px 16px',
        }}
      >
        <style>{PAGE_TOAST_PREVIEW_CSS}</style>
        {view ? (
          <div className="flex justify-start">
            <Notification
              embedded
              otp={view === 'ready' ? previewOtp : null}
              loading={view === 'waiting'}
              waitingForNew={view === 'waiting'}
              onFill={() => {}}
              onCopy={() => {}}
              onDismiss={() => setView(null)}
              dismissAfterMs={dismissMs}
              onUseLatestCode={() => setView('ready')}
            />
          </div>
        ) : (
          <p className="text-xs text-[var(--blink-muted)] m-0 text-center leading-relaxed">
            Choose a preview above to see the toast here.
          </p>
        )}
      </div>
    </div>
  );
}
