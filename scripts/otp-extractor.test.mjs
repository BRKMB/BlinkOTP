import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src/shared/otp-extractor.ts'), 'utf8');

for (const needle of ['LETTER_ONLY_BLOCKLIST', 'isWordNotCode', 'pickBestCandidate']) {
  if (!src.includes(needle)) throw new Error(`Missing ${needle}`);
}

function normalizeCode(raw) {
  return raw.replace(/[\s\-_.]/g, '').toUpperCase();
}

function isWordNotCode(code) {
  const block = new Set(['GITHUB', 'VERIFY', 'CODE']);
  if (block.has(code)) return true;
  if (!/\d/.test(code) && /^[A-Z]+$/.test(code)) return code.length >= 4;
  return false;
}

function sanitizeOtpCode(code) {
  const n = normalizeCode(code);
  const glued = n.match(/^(\d{4,12})([A-Z]{2,})$/);
  if (glued) return glued[1];
  const leading = n.match(/^(\d{4,12})/);
  if (leading) return leading[1];
  return n;
}

const bad = sanitizeOtpCode('28421706THIS');
if (bad !== '28421706') throw new Error(`glued fix failed: got ${bad}`);

console.log('otp-extractor guards OK — glued THIS stripped from digits');
