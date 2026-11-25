import type { Page } from '@playwright/test';

const RECORD_KEY = '__noticeAnimations';

export default async function recordNoticeAnimations(page: Page): Promise<() => Promise<number>> {
  await page.evaluate((key) => {
    const started: string[] = [];
    Reflect.set(window, key, started);
    document.addEventListener('animationstart', ({ target, animationName }) => {
      const inBanner = target instanceof Element && target.closest('header') !== null;
      if (inBanner) started.push(animationName);
    });
  }, RECORD_KEY);

  return (): Promise<number> =>
    page.evaluate((key) => (Reflect.get(window, key) as string[]).length, RECORD_KEY);
}
