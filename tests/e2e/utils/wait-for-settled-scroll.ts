import type { Page } from '@playwright/test';

const STABLE_FRAMES = 5;

interface ScrollProbe {
  last: string;
  count: number;
}

type ProbeWindow = Window & { pwSettledScroll?: ScrollProbe };

export default async function waitForSettledScroll(page: Page): Promise<void> {
  await page.evaluate(() => {
    delete (window as ProbeWindow).pwSettledScroll;
  });

  await page.waitForFunction(
    (frames) => {
      const probe = window as ProbeWindow;
      const position = `${window.scrollX}|${window.scrollY}`;
      const state = probe.pwSettledScroll ?? { last: '', count: 0 };
      state.count = state.last === position ? state.count + 1 : 0;
      state.last = position;
      probe.pwSettledScroll = state;
      return state.count >= frames;
    },
    STABLE_FRAMES,
    { polling: 'raf' }
  );
}
