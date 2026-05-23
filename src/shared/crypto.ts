const KEY_STORAGE = 'blinkotp_master_key_v1';
const SALT_STORAGE = 'blinkotp_salt_v1';

async function getOrCreateMasterKey(): Promise<CryptoKey> {
  const stored = await chrome.storage.local.get([KEY_STORAGE, SALT_STORAGE]);
  if (stored[KEY_STORAGE] && stored[SALT_STORAGE]) {
    const raw = Uint8Array.from(atob(stored[KEY_STORAGE] as string), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, [
      'encrypt',
      'decrypt',
    ]);
  }

  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ]);
  const exported = await crypto.subtle.exportKey('raw', key);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltB64 = btoa(String.fromCharCode(...salt));
  await chrome.storage.local.set({ [KEY_STORAGE]: b64, [SALT_STORAGE]: saltB64 });
  return key;
}

function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export async function encryptText(plain: string): Promise<string> {
  const key = await getOrCreateMasterKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plain);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return `${toBase64(iv.buffer)}.${toBase64(cipher)}`;
}

export async function decryptText(payload: string): Promise<string> {
  const [ivB64, cipherB64] = payload.split('.');
  if (!ivB64 || !cipherB64) throw new Error('Invalid encrypted payload');
  const key = await getOrCreateMasterKey();
  const iv = fromBase64(ivB64);
  const cipher = fromBase64(cipherB64);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    cipher.buffer as ArrayBuffer,
  );
  return new TextDecoder().decode(plain);
}

export async function clearMasterKey(): Promise<void> {
  await chrome.storage.local.remove([KEY_STORAGE, SALT_STORAGE]);
}
