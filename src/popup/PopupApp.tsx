import { useCallback, useEffect, useMemo, useState } from 'react';
import { sendToBackground } from '../shared/runtime-messaging';
import { getSettings, saveSettings } from '../shared/storage';
import { BRAND } from '../shared/brand';
import type { UserSettings } from '../shared/types';
import { AccountSwitcher, needsRenewal } from '../ui/AccountSwitcher';
import { BlinkLogo } from '../ui/BlinkLogo';
import { GradientButton } from '../ui/GradientButton';
import { IconMail, IconRefresh, IconVerificationCode } from '../ui/icons';
import { PopupFooter } from '../ui/PopupFooter';
import { SectionHeading } from '../ui/SectionHeading';
import { StatusPill } from '../ui/StatusPill';
import { TrustStrip } from '../ui/TrustStrip';

export function PopupApp() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await sendToBackground<UserSettings>({ type: 'GET_SETTINGS' });
      if (res.ok && res.data) {
        setSettings(res.data);
        return;
      }
      setSettings(await getSettings());
      if (res.error) setError(res.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings?.theme ?? 'dark');
  }, [settings?.theme]);

  useEffect(() => {
    const onChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area !== 'local' || !changes.blinkotp_settings?.newValue) return;
      setSettings(changes.blinkotp_settings.newValue as UserSettings);
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);

  const gmailAccounts = useMemo(
    () => settings?.accounts.filter((a) => a.provider === 'gmail') ?? [],
    [settings?.accounts],
  );

  const activeId =
    settings?.activeAccountId && gmailAccounts.some((a) => a.id === settings.activeAccountId)
      ? settings.activeAccountId
      : (gmailAccounts[0]?.id ?? null);

  const activeAccount = gmailAccounts.find((a) => a.id === activeId) ?? null;
  const needsReconnect = activeAccount ? needsRenewal(activeAccount) : false;

  async function setActiveAccount(id: string) {
    setSettings(await saveSettings({ activeAccountId: id }));
  }

  async function setTheme(theme: UserSettings['theme']) {
    setSettings(await saveSettings({ theme }));
  }

  async function handleConnect(renew = false) {
    setConnecting(true);
    setError(null);
    const res = await sendToBackground<UserSettings>({
      type: 'CONNECT_PROVIDER',
      provider: 'gmail',
      renew,
    });
    setConnecting(false);
    if (res.ok && res.data) setSettings(res.data);
    else setError(res.error ?? 'Connection failed');
  }

  async function handleFetchOtp() {
    if (!activeId) return;
    setFetching(true);
    setFetchStatus(null);
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    let host = 'unknown';
    try {
      if (tabs[0]?.url) host = new URL(tabs[0].url).hostname;
    } catch {
      /* ignore */
    }
    const res = await sendToBackground<{ code: string; maskedCode: string }>({
      type: 'FETCH_LATEST_OTP',
      host,
      force: true,
      accountId: activeId,
    });
    setFetching(false);
    if (res.ok && res.data) {
      setFetchStatus(`Ready · ${res.data.maskedCode}`);
      return;
    }
    setFetchStatus(res.error ?? 'No code found');
  }

  if (loading) {
    return (
      <div className="blink-popup blink-shell items-center justify-center py-12">
        <BlinkLogo size={40} className="blink-shimmer" />
        <p className="blink-body-muted mt-3">Loading…</p>
      </div>
    );
  }

  const theme = settings?.theme ?? 'dark';

  return (
    <div className="blink-popup blink-shell">
      <header className="blink-popup__header">
        <div className="flex min-w-0 items-center gap-3">
          <BlinkLogo size={36} />
          <div className="min-w-0">
            <h1 className="blink-title">{BRAND.name}</h1>
            <p className="blink-subtitle">{BRAND.tagline}</p>
          </div>
        </div>
      </header>

      <main className="blink-popup__main">
        {error && <StatusPill tone="danger">{error}</StatusPill>}

        {gmailAccounts.length === 0 ? (
          <>
            <StatusPill tone="warn">Connect Gmail to continue</StatusPill>
            <GradientButton
              fullWidth
              size="large"
              loading={connecting}
              icon={<IconMail size={18} className="text-white" />}
              onClick={() => void handleConnect(false)}
            >
              Connect Gmail
            </GradientButton>
            <TrustStrip />
          </>
        ) : (
          <>
            {needsReconnect && (
              <StatusPill tone="danger">Reconnect Gmail to continue</StatusPill>
            )}

            <div>
              <SectionHeading statusDot={needsReconnect ? 'danger' : 'ok'}>
                Connected accounts
              </SectionHeading>
              <AccountSwitcher
                accounts={gmailAccounts}
                selectedId={activeId}
                onSelect={(id) => void setActiveAccount(id)}
                onAddAccount={() => void handleConnect(false)}
                adding={connecting}
              />
            </div>

            {needsReconnect && activeAccount && (
              <GradientButton
                fullWidth
                variant="secondary"
                loading={connecting}
                icon={<IconRefresh size={15} />}
                onClick={() => void handleConnect(true)}
              >
                Reconnect
              </GradientButton>
            )}

            <div className="blink-popup__stack-tight">
              <GradientButton
                variant="glass"
                fullWidth
                size="large"
                loading={fetching}
                icon={<IconVerificationCode size={18} className="blink-cta-icon" />}
                onClick={() => void handleFetchOtp()}
              >
                {fetching ? 'Checking inbox…' : 'Get verification code'}
              </GradientButton>
              {fetchStatus && <p className="blink-feedback">{fetchStatus}</p>}
            </div>

            <TrustStrip />
          </>
        )}

      </main>

      <PopupFooter theme={theme} onThemeChange={(t) => void setTheme(t)} />
    </div>
  );
}
