import type { ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { PAGE_TOAST_SHADOW_CSS } from './page-toast-styles';

const HOST_ID = 'blinkotp-shadow-host';

export function syncContentUiTheme(theme: 'dark' | 'light'): void {
  const host = document.getElementById(HOST_ID);
  const root = host?.shadowRoot?.querySelector<HTMLElement>('#blinkotp-app');
  if (root) root.setAttribute('data-theme', theme);
}

export function mountShadowUi(render: (container: HTMLElement) => void): () => void {
  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElement('div');
    host.id = HOST_ID;
    host.style.all = 'initial';
    host.style.position = 'fixed';
    host.style.zIndex = '2147483646';
    host.style.pointerEvents = 'none';
    host.style.inset = '0';
    document.documentElement.appendChild(host);
  }

  const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'closed' });
  let container = shadow.querySelector<HTMLElement>('#blinkotp-app');
  if (!container) {
    container = document.createElement('div');
    container.id = 'blinkotp-app';
    container.setAttribute('data-theme', 'dark');
    container.style.pointerEvents = 'auto';
    shadow.appendChild(container);

    const style = document.createElement('style');
    style.textContent = PAGE_TOAST_SHADOW_CSS;
    shadow.appendChild(style);
  }

  render(container);
  return () => {
    container?.replaceChildren();
  };
}

let reactRoot: Root | null = null;

export function mountReactUi(container: HTMLElement, element: ReactElement): void {
  reactRoot ??= createRoot(container);
  reactRoot.render(element);
}
