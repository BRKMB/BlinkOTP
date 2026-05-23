import { create } from 'zustand';
import { sendToBackground } from '../shared/runtime-messaging';
import { getSettings as readLocalSettings } from '../shared/storage';
import type { UserSettings } from '../shared/types';

interface SettingsState {
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  connect: (renew?: boolean) => Promise<string | null>;
  disconnect: (accountId: string) => Promise<void>;
  update: (partial: Partial<UserSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loading: true,
  error: null,
  load: async () => {
    set({ loading: true, error: null });
    try {
      const res = await sendToBackground<UserSettings>({ type: 'GET_SETTINGS' });
      if (res.ok && res.data) {
        set({ settings: res.data, loading: false, error: null });
        return;
      }
      const local = await readLocalSettings();
      set({
        settings: local,
        loading: false,
        error: res.error ?? null,
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to read settings',
      });
    }
  },
  connect: async (renew = false) => {
    set({ error: null });
    const res = await sendToBackground<UserSettings>({
      type: 'CONNECT_PROVIDER',
      provider: 'gmail',
      renew,
    });
    if (res.ok && res.data) {
      set({ settings: res.data });
      return null;
    }
    const msg = res.error ?? 'Connection failed';
    set({ error: msg });
    return msg;
  },
  disconnect: async (accountId) => {
    const res = await sendToBackground<UserSettings>({
      type: 'DISCONNECT_ACCOUNT',
      accountId,
    });
    if (res.ok && res.data) set({ settings: res.data });
  },
  update: async (partial) => {
    const res = await sendToBackground<UserSettings>({ type: 'SAVE_SETTINGS', settings: partial });
    if (res.ok && res.data) set({ settings: res.data });
    else {
      const current = get().settings;
      if (current) set({ settings: { ...current, ...partial } });
    }
  },
}));
