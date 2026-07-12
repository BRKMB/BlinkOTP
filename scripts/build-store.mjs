#!/usr/bin/env node
/**
 * Production build for Chrome Web Store — never embeds OAuth client secrets.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';

function parseEnvFile(text) {
  const vars = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    vars[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return vars;
}

for (const name of readdirSync('.')) {
  if (name.startsWith('client_secret') && name.endsWith('.json')) {
    console.error(`[build:store] Remove ${name} from the project root first.`);
    process.exit(1);
  }
}

let localEnv = {};
try {
  localEnv = parseEnvFile(readFileSync('.env.local', 'utf8'));
  if (localEnv.VITE_GOOGLE_WEB_CLIENT_SECRET?.trim()) {
    console.warn(
      '[build:store] .env.local contains VITE_GOOGLE_WEB_CLIENT_SECRET — overriding to empty for this build.',
    );
  }
} catch {
  /* no .env.local */
}

console.log('[build:store] Building without client secret…');
const env = {
  ...process.env,
  ...localEnv,
  VITE_GOOGLE_WEB_CLIENT_SECRET: '',
};
const result = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true, env });
if (result.status !== 0) process.exit(result.status ?? 1);

const distCheck = spawnSync('grep', ['-rl', 'GOCSPX', 'dist'], { encoding: 'utf8' });
if (distCheck.stdout?.trim()) {
  console.error('\n[build:store] OAuth client secret found in dist/. Aborting pack.');
  process.exit(1);
}
console.log('[build:store] OK — no client secret in bundle.');
