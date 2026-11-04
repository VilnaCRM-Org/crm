import { Page, expect } from '@playwright/test';

import { currentLanguage } from '@tests/visual/constants';
import stabilizePage from '@tests/visual/stabilize-page';

export const MOBILE_SNAPSHOT_OPTIONS = {
  fullPage: true,
  animations: 'disabled',
  scale: 'device',
} as const;

export const mobileSnapshotName = (name: string): string => `${currentLanguage}_${name}.png`;

async function captureMobileSnapshot(page: Page, name: string): Promise<void> {
  await expect(page).toHaveScreenshot(mobileSnapshotName(name), MOBILE_SNAPSHOT_OPTIONS);
}

export async function takeReadyMobileSnapshot(
  page: Page,
  url: string,
  name: string,
  readyLabel: string
): Promise<void> {
  await stabilizePage(page, url);
  await expect(page.getByLabel(readyLabel)).toBeVisible();
  await captureMobileSnapshot(page, name);
}

async function takeMobileSnapshot(page: Page, url: string, name: string): Promise<void> {
  await stabilizePage(page, url);
  await captureMobileSnapshot(page, name);
}

export default takeMobileSnapshot;
