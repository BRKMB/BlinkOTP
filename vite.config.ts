import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), crx({ manifest })],
  build: {
    rollupOptions: {
      input: {
        popup: 'src/popup/index.html',
        options: 'src/options/index.html',
      },
      output: {
        manualChunks(id) {
          if (id.includes('runtime-messaging')) return 'blink-messaging';
          if (id.includes('framer-motion') || id.includes('motion-dom')) return 'blink-motion';
        },
      },
    },
  },
});
