import { defineManifest } from '@crxjs/vite-plugin';
import {
  DEFAULT_GOOGLE_CHROME_CLIENT_ID,
  GMAIL_SCOPE,
} from './src/shared/google-oauth-ids';

const GOOGLE_CHROME_CLIENT_ID =
  process.env.VITE_GOOGLE_CLIENT_ID ?? DEFAULT_GOOGLE_CHROME_CLIENT_ID;

export default defineManifest({
  manifest_version: 3,
  name: 'BlinkOTP',
  version: '1.0.12',
  description:
    'Instant, automatic OTP autofill from your email — private, free, and fully automatic.',
  permissions: ['storage', 'identity', 'identity.email', 'alarms', 'clipboardWrite', 'activeTab', 'tabs'],
  oauth2: {
    client_id: GOOGLE_CHROME_CLIENT_ID,
    scopes: [GMAIL_SCOPE],
  },
  host_permissions: ['https://www.googleapis.com/*', 'https://gmail.googleapis.com/*'],
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'BlinkOTP',
  },
  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true,
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
      all_frames: true,
    },
  ],
  commands: {
    'fetch-latest-otp': {
      suggested_key: {
        default: 'Ctrl+Shift+O',
        mac: 'Command+Shift+O',
      },
      description: 'Fetch latest OTP from email',
    },
    'fill-latest-otp': {
      suggested_key: {
        default: 'Ctrl+Shift+U',
        mac: 'Command+Shift+U',
      },
      description: 'Fill latest OTP into focused field',
    },
  },
  icons: {
    '16': 'public/icons/icon-16.png',
    '32': 'public/icons/icon-32.png',
    '48': 'public/icons/icon-48.png',
    '128': 'public/icons/icon-128.png',
  },
  incognito: 'split',
  web_accessible_resources: [
    {
      matches: ['<all_urls>'],
      resources: ['brand/logo.png'],
    },
  ],
});
