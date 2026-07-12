#!/usr/bin/env node
/** Zip dist/ for Chrome Web Store upload (contents of dist/, not the folder itself). */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const zipPath = path.join(root, 'blinkotp-store.zip');

if (!existsSync(path.join(distDir, 'manifest.json'))) {
  console.error('[pack:store] Run npm run build:store first.');
  process.exit(1);
}

spawnSync('rm', ['-f', zipPath], { stdio: 'inherit' });
const result = spawnSync(
  'zip',
  ['-r', zipPath, '.', '-x', '*.DS_Store', '-x', '*/.DS_Store', '-x', 'blinkotp-store.zip'],
  { cwd: distDir, stdio: 'inherit' },
);

if (result.status !== 0) {
  console.error(
    '[pack:store] zip failed. Install zip or run: cd dist && zip -r ../blinkotp-store.zip . -x "*.DS_Store"',
  );
  process.exit(result.status ?? 1);
}

console.log(`\n[pack:store] Ready: ${zipPath}\nUpload this ZIP in Chrome Web Store Developer Dashboard.`);
