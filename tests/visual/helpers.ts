import { Page } from '@playwright/test';

const injectedPages = new WeakSet<Page>();

export function normalizeSnapshotName(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export async function injectAnimationDisabler(page: Page): Promise<void> {
  if (injectedPages.has(page)) return;
  await page.addInitScript(() => {
    if (document.getElementById('__pw-disable-animations')) return;
    const style = document.createElement('style');
    style.id = '__pw-disable-animations';
    style.textContent = `
        *, *::before, *::after {
          transition: none !important;
          animation: none !important;
          caret-color: transparent !important;
        }`;
    document.head.appendChild(style);
  });
  injectedPages.add(page);
}
