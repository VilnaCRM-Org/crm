import type { Page } from '@playwright/test';

import { timeoutDuration } from './constants';

const STABLE_FRAMES = 5;

interface StableDomProbe {
  last: string;
  count: number;
}

type ProbeWindow = Window & { pwStableDom?: StableDomProbe };

async function waitForStableDom(page: Page): Promise<void> {
  await page.evaluate(() => {
    delete (window as ProbeWindow).pwStableDom;
  });

  await page.waitForFunction(
    (frames) => {
      const probe = window as ProbeWindow;
      const fingerprint = [
        document.readyState,
        document.fonts.status,
        document.documentElement.outerHTML.length,
      ].join('|');
      const state = probe.pwStableDom ?? { last: '', count: 0 };
      state.count = state.last === fingerprint ? state.count + 1 : 0;
      state.last = fingerprint;
      probe.pwStableDom = state;
      return (
        state.count >= frames &&
        document.readyState === 'complete' &&
        document.fonts.status === 'loaded'
      );
    },
    STABLE_FRAMES,
    { polling: 'raf', timeout: timeoutDuration }
  );
}

export default waitForStableDom;
