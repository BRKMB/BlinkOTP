#!/usr/bin/env node
/**
 * Production build for Chrome Web Store — never embeds OAuth client secrets.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';

for (const name of readdirSync('.')) {
  if (name.startsWith('client_secret') && name.endsWith('.json')) {
    console.error(`[build:store] Remove ${name} from the project root first.`);
    process.exit(1);
  }
}

try {
  const local = readFileSync('.env.local', 'utf8');
  const secretLine = local
    .split('\n')
    .find((l) => l.startsWith('VITE_GOOGLE_WEB_CLIENT_SECRET=') && l.split('=')[1]?.trim());
  if (secretLine) {
    console.warn(
      '[build:store] .env.local contains VITE_GOOGLE_WEB_CLIENT_SECRET — overriding to empty for this build.',
    );
  }
} catch {
  /* no .env.local */
}

console.log('[build:store] Building without client secret…');
const env = { ...process.env, VITE_GOOGLE_WEB_CLIENT_SECRET: '' };
const result = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true, env });
if (result.status !== 0) process.exit(result.status ?? 1);

const distCheck = spawnSync('grep', ['-rl', 'GOCSPX', 'dist'], { encoding: 'utf8' });
if (distCheck.stdout?.trim()) {
  console.error('\n[build:store] OAuth client secret found in dist/. Aborting pack.');
  process.exit(1);
}
console.log('[build:store] OK — no client secret in bundle.');
