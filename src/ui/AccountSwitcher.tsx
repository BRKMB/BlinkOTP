import { useEffect, useRef, useState } from 'react';
import { isTokenExpired } from '../shared/account-auth';
import type { EmailAccount } from '../shared/types';
import { IconChevronDown, IconPlus } from './icons';

interface Props {
  accounts: EmailAccount[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddAccount: () => void;
  adding?: boolean;
}

function needsRenewal(account: EmailAccount): boolean {
  if (account.authMethod === 'chrome_identity' || account.webAutoRefresh) return false;
  if (!account.authMethod && account.chromeAccountId && account.tokenExpiresAt === undefined) {
    return false;
  }
  if (!account.tokenExpiresAt) return false;
  return isTokenExpired(account.tokenExpiresAt);
}

/** First character of the mailbox name — unique per email (e.g. john@… → J). */
function accountInitial(email: string): string {
  const local = email.split('@')[0]?.trim() ?? '';
  if (!local) return '?';
  const first = [...local][0];
  return first ? first.toLocaleUpperCase() : '?';
}

export function AccountSwitcher({
  accounts,
  selectedId,
  onSelect,
  onAddAccount,
  adding,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = accounts.find((a) => a.id === selectedId) ?? accounts[0] ?? null;
  const multipleAccounts = accounts.length > 1;
  const otherAccounts = selected
    ? accounts.filter((a) => a.id !== selected.id)
    : accounts;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (!selected) return null;

  const menuLabel = multipleAccounts ? 'Switch or add account' : 'Add another Gmail account';

  return (
    <div ref={rootRef} className="blink-account-switcher">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`${selected.email}. ${menuLabel}`}
        className={`blink-account-card${open ? ' blink-account-card--open' : ''}`}
      >
        <span className="blink-account-card__avatar" title={selected.email}>
          {accountInitial(selected.email)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="blink-account-card__email">{selected.email}</span>
          {multipleAccounts && (
            <span className="blink-account-card__meta">{accounts.length} accounts</span>
          )}
        </span>
        <span
          className="flex shrink-0 text-[var(--blink-muted)] transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
          aria-hidden
        >
          <IconChevronDown size={16} />
        </span>
      </button>

      {open && (
        <div className="blink-account-switcher__menu" role="menu" aria-label={menuLabel}>
          {multipleAccounts &&
            otherAccounts.map((a) => {
              const expired = needsRenewal(a);
              return (
                <button
                  key={a.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onSelect(a.id);
                    setOpen(false);
                  }}
                  className="blink-account-card"
                >
                  <span className="blink-account-card__avatar" title={a.email}>
                    {accountInitial(a.email)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="blink-account-card__email">{a.email}</span>
                    {expired && (
                      <span className="blink-account-card__meta blink-account-card__meta--warn">
                        Reconnect required
                      </span>
                    )}
                  </span>
                </button>
              );
            })}

          <button
            type="button"
            role="menuitem"
            className="blink-account-card"
            disabled={adding}
            onClick={() => {
              onAddAccount();
              setOpen(false);
            }}
          >
            <span className="blink-account-card__avatar">
              {adding ? (
                <span
                  className="blink-spinner border-white/30 border-t-white"
                  aria-hidden
                />
              ) : (
                <IconPlus size={16} />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="blink-account-card__email">
                {adding ? 'Opening…' : 'Add Gmail'}
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export { needsRenewal };
