import type { Page } from '@playwright/test';

const FREEZE_AHEAD_MS = 500;

export async function installClock(page: Page): Promise<void> {
  await page.clock.install();
}

export async function freezeClock(page: Page): Promise<void> {
  const frozenAt = await page.evaluate((ahead) => Date.now() + ahead, FREEZE_AHEAD_MS);
  await page.clock.pauseAt(frozenAt);
}
