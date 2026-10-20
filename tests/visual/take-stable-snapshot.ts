import { expect, type Page } from '@playwright/test';

import waitForStableDom from './wait-for-stable-dom';

export const SNAPSHOT_OPTIONS = {
  fullPage: true,
  animations: 'disabled',
  scale: 'css',
} as const;

async function takeStableSnapshot(page: Page, fileName: string): Promise<void> {
  await waitForStableDom(page);
  await expect(page).toHaveScreenshot(fileName, SNAPSHOT_OPTIONS);
}

export default takeStableSnapshot;
