import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { sendToBackground } from '../shared/runtime-messaging';
import { useSettingsStore } from '../stores/settings';
import { needsRenewal } from '../ui/AccountSwitcher';
import { BRAND } from '../shared/brand';
import type { EmailAccount, OtpHistoryEntry } from '../shared/types';
import { BlinkLogo } from '../ui/BlinkLogo';
import { BrandSignature } from '../ui/BrandSignature';
import { GlassPanel } from '../ui/GlassPanel';
import { GradientButton } from '../ui/GradientButton';
import { SectionHeading } from '../ui/SectionHeading';
import { StatusPill } from '../ui/StatusPill';
import { IconMail, IconPlus, IconRefresh } from '../ui/icons';
import { ThemeToggle } from '../ui/ThemeToggle';
import { clampPageToastDurationSec, PAGE_TOAST_DURATION_MAX_SEC, PAGE_TOAST_DURATION_MIN_SEC } from '../shared/page-toast-settings';
import { PageToastPreviewPanel } from './PageToastPreviewPanel';

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 py-3.5 border-b border-[var(--blink-border)] cursor-pointer last:border-0">
      <div>
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-[var(--blink-muted)] mt-1 leading-relaxed">{description}</div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 w-4 h-4 rounded accent-[#8b7cf8]"
      />
    </label>
  );
}

export function OptionsApp() {
  const { settings, load, update, connect, disconnect, error: storeError } = useSettingsStore();
  const [history, setHistory] = useState<OtpHistoryEntry[]>([]);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings?.theme ?? 'dark');
  }, [settings?.theme]);

  useEffect(() => {
    void sendToBackground<OtpHistoryEntry[]>({ type: 'GET_HISTORY' }).then((res) => {
      if (res.ok && res.data) setHistory(res.data);
    });
  }, []);

  const gmailAccounts = useMemo(
    () => settings?.accounts.filter((a) => a.provider === 'gmail') ?? [],
    [settings?.accounts],
  );

  if (!settings) {
    return (
      <div className="min-h-screen blink-shell flex items-center justify-center text-[var(--blink-muted)]">
        <BlinkLogo size={56} className="blink-shimmer" />
      </div>
    );
  }

  const theme = settings.theme ?? 'dark';

  return (
    <div className="min-h-screen blink-shell text-[var(--blink-text)]">
      <div className="max-w-2xl mx-auto w-full px-6 py-10 flex flex-col min-h-screen">
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <BlinkLogo size={52} />
            <div>
              <h1 className="text-2xl font-bold m-0 tracking-tight">{BRAND.name}</h1>
              <p className="text-sm text-[var(--blink-muted)] mt-1 m-0">Settings</p>
            </div>
          </div>
          <ThemeToggle theme={theme} onChange={(t) => void update({ theme: t })} />
        </motion.header>

        {storeError && (
          <div className="mt-5">
            <StatusPill tone="danger">{storeError}</StatusPill>
          </div>
        )}

        <section className="mt-8">
          <SectionHeading>Gmail accounts</SectionHeading>
          <GlassPanel className="p-5">
            <p className="text-xs text-[var(--blink-muted)] m-0 mb-4 leading-relaxed">
              Add as many Gmail accounts as you need. Each address appears once — renewing replaces
              the old session for that address only.
            </p>
            <GradientButton
              disabled={connecting}
              icon={<IconPlus size={18} className="text-white" />}
              onClick={async () => {
                setConnecting(true);
                await connect(false);
                setConnecting(false);
              }}
            >
              {connecting ? 'Connecting…' : 'Add Gmail account'}
            </GradientButton>
            <ul className="list-none p-0 m-0 mt-4 space-y-2">
              {gmailAccounts.length === 0 && (
                <li className="text-sm text-[var(--blink-muted)] py-2">No accounts yet</li>
              )}
              {gmailAccounts.map((a) => (
                <AccountRow
                  key={a.id}
                  account={a}
                  onRenew={async () => {
                    setConnecting(true);
                    await connect(true);
                    setConnecting(false);
                  }}
                  onRemove={() => void disconnect(a.id)}
                  renewing={connecting}
                />
              ))}
            </ul>
          </GlassPanel>
        </section>

        <section className="mt-6">
          <SectionHeading>Automation</SectionHeading>
          <GlassPanel className="px-5 pb-1">
            <Toggle
              label="Auto-fetch when code field appears"
              description="When a code field appears: popup opens immediately, then Gmail fetch + auto-fill"
              checked={settings.autoFetchOnVerificationPages}
              onChange={(v) => void update({ autoFetchOnVerificationPages: v })}
            />
            <Toggle
              label="Use latest code immediately"
              description="Skip smart wait and fill with the newest OTP already in Gmail (may be from a previous sign-in)"
              checked={settings.useLatestCodeImmediately}
              onChange={(v) => void update({ useLatestCodeImmediately: v })}
            />
            <Toggle
              label="Automatic fill"
              description="Insert the code when a verification field is detected"
              checked={settings.autoFill}
              onChange={(v) => void update({ autoFill: v })}
            />
            <Toggle
              label="Clipboard fallback"
              description="Copy the code if the site blocks programmatic fill"
              checked={settings.autoCopyFallback}
              onChange={(v) => void update({ autoCopyFallback: v })}
            />
            <Toggle
              label="Auto-submit"
              description="Press Verify / Continue after fill (1 second delay)"
              checked={settings.autoSubmit}
              onChange={(v) => void update({ autoSubmit: v })}
            />
            <Toggle
              label="Domain safety check"
              description="Warn when the email sender does not match the website"
              checked={settings.domainWarning}
              onChange={(v) => void update({ domainWarning: v })}
            />
            <Toggle
              label="Privacy mode"
              description="Mask codes in the UI (last 2 digits visible)"
              checked={settings.privacyMode}
              onChange={(v) => void update({ privacyMode: v })}
            />
            <Toggle
              label="Field bubble"
              description="Show the quick-fill shortcut beside detected OTP inputs"
              checked={settings.showBubble}
              onChange={(v) => void update({ showBubble: v })}
            />
          </GlassPanel>
        </section>

        <section className="mt-6">
          <SectionHeading>Page toast (top-left)</SectionHeading>
          <GlassPanel className="p-5">
            <p className="text-xs text-[var(--blink-muted)] m-0 mb-4 leading-relaxed">
              The toast that appears on verification pages when BlinkOTP fetches your code.
            </p>
            <label className="block">
              <span className="text-sm font-medium">Code toast — auto-close after</span>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="range"
                  min={PAGE_TOAST_DURATION_MIN_SEC}
                  max={PAGE_TOAST_DURATION_MAX_SEC}
                  step={1}
                  value={clampPageToastDurationSec(settings.pageToastDurationSec)}
                  onChange={(e) =>
                    void update({
                      pageToastDurationSec: clampPageToastDurationSec(Number(e.target.value)),
                    })
                  }
                  className="flex-1 accent-[#8b7cf8]"
                />
                <span className="text-sm font-mono tabular-nums w-10 text-right text-[var(--blink-text)]">
                  {clampPageToastDurationSec(settings.pageToastDurationSec)}s
                </span>
              </div>
              <span className="text-xs text-[var(--blink-muted)] mt-1 block">
                Applies only when your code is ready ({PAGE_TOAST_DURATION_MIN_SEC}–
                {PAGE_TOAST_DURATION_MAX_SEC} s). The waiting toast stays open until the code
                arrives or you close it.
              </span>
            </label>

            <PageToastPreviewPanel
              durationSec={clampPageToastDurationSec(settings.pageToastDurationSec)}
              theme={settings.theme ?? 'dark'}
            />
          </GlassPanel>
        </section>

        <section className="mt-6">
          <SectionHeading>Recent codes</SectionHeading>
          <GlassPanel className="p-5">
            <p className="text-xs text-[var(--blink-muted)] m-0 mb-3">
              Last 5 codes, encrypted locally, removed after 24 hours.
            </p>
            <ul className="list-none p-0 m-0 space-y-2 text-sm">
              {history.length === 0 && (
                <li className="text-[var(--blink-muted)]">No history yet</li>
              )}
              {history.map((h) => (
                <li
                  key={h.id}
                  className="blink-rounded-md flex justify-between px-3 py-2.5 bg-[var(--blink-surface)] border border-[var(--blink-border)]"
                >
                  <span className="font-mono text-xs">{h.maskedCode}</span>
                  <span className="text-[var(--blink-muted)] text-xs">{h.siteHost}</span>
                </li>
              ))}
            </ul>
            {history.length > 0 && (
              <GradientButton
                variant="ghost"
                className="!text-red-400 mt-4"
                onClick={async () => {
                  await sendToBackground({ type: 'CLEAR_HISTORY' });
                  setHistory([]);
                }}
              >
                Clear history
              </GradientButton>
            )}
          </GlassPanel>
        </section>

        <p className="mt-8 text-xs text-[var(--blink-muted)]">
          Shortcuts: <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--blink-surface)] border border-[var(--blink-border)]">⌘⇧O</kbd> fetch ·{' '}
          <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--blink-surface)] border border-[var(--blink-border)]">⌘⇧U</kbd> fill
        </p>

        <BrandSignature className="mt-6" />
      </div>
    </div>
  );
}

function AccountRow({
  account,
  onRenew,
  onRemove,
  renewing,
}: {
  account: EmailAccount;
  onRenew: () => void;
  onRemove: () => void;
  renewing: boolean;
}) {
  const showRenew = needsRenewal(account);

  return (
    <li className="blink-rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm px-4 py-3 bg-[var(--blink-surface)] border border-[var(--blink-border)]">
      <div className="flex min-w-0 items-start gap-2">
        <IconMail size={16} className="mt-0.5 shrink-0 text-[var(--blink-accent)]" />
        <div className="min-w-0">
        <p className="m-0 font-medium truncate">{account.email}</p>
        <p className="m-0 mt-1.5 text-xs text-[var(--blink-muted)]">
          {showRenew ? (
            <span className="text-[var(--blink-status-danger-text)]">Reconnect required</span>
          ) : (
            <span className="text-[var(--blink-status-ok-text)]">Connected</span>
          )}
        </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        {showRenew && (
          <GradientButton
            variant="secondary"
            className="!py-1.5 !px-3 !text-xs"
            icon={<IconRefresh size={14} />}
            disabled={renewing}
            onClick={onRenew}
          >
            Renew
          </GradientButton>
        )}
        <GradientButton variant="ghost" className="!text-xs !text-red-400" onClick={onRemove}>
          Remove
        </GradientButton>
      </div>
    </li>
  );
}
