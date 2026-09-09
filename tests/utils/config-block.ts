import { APP_CONFIG_ELEMENT_ID } from '@/config/runtime/app-config-source';

/**
 * Test-side counterpart of the inline `<script id="app-runtime-config">` block that
 * `public/index.html` ships and `scripts/render-app-config.js` rewrites at container start.
 * The runtime config layer is the only code that reads it, so every suite under
 * `tests/unit/config/runtime` drives it through these two helpers.
 */
export function clearConfigBlock(): void {
  document.getElementById(APP_CONFIG_ELEMENT_ID)?.remove();
}

export function writeConfigBlock(text: string): HTMLScriptElement {
  clearConfigBlock();

  const element = document.createElement('script');
  element.id = APP_CONFIG_ELEMENT_ID;
  element.type = 'application/json';
  element.textContent = text;
  document.head.appendChild(element);

  return element;
}
