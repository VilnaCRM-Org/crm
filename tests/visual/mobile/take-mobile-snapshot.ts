import { Page, expect } from '@playwright/test';

import { currentLanguage } from '@tests/visual/constants';
import stabilizePage from '@tests/visual/stabilize-page';

export const MOBILE_SNAPSHOT_OPTIONS = {
  fullPage: true,
  animations: 'disabled',
  scale: 'device',
} as const;

export const mobileSnapshotName = (name: string): string => `${currentLanguage}_${name}.png`;

async function takeMobileSnapshot(
  page: Page,
  url: string,
  name: string,
  readyLabel?: string
): Promise<void> {
  await stabilizePage(page, url);
  if (readyLabel !== undefined) await expect(page.getByLabel(readyLabel)).toBeVisible();

  await expect(page).toHaveScreenshot(mobileSnapshotName(name), MOBILE_SNAPSHOT_OPTIONS);
}

export default takeMobileSnapshot;
