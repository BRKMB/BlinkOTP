#!/usr/bin/env node
/** Zip dist/ for Chrome Web Store upload (contents of dist/, not the folder itself). */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (!existsSync('dist/manifest.json')) {
  console.error('[pack:store] Run npm run build:store first.');
  process.exit(1);
}

const zip = 'blinkotp-store.zip';
spawnSync('rm', ['-f', zip], { stdio: 'inherit' });
const result = spawnSync('zip', ['-r', zip, '.'], {
  cwd: 'dist',
  stdio: 'inherit',
});

if (result.status !== 0) {
  console.error('[pack:store] zip failed. Install zip or run: cd dist && zip -r ../blinkotp-store.zip .');
  process.exit(result.status ?? 1);
}

console.log(`\n[pack:store] Ready: ${zip}\nUpload this file in Chrome Web Store Developer Dashboard.`);
