import { Page, expect } from '@playwright/test';

import { currentLanguage, ScreenSize } from './constants';
import stabilizePage from './stabilize-page';
import { SNAPSHOT_OPTIONS } from './take-stable-snapshot';

async function takeVisualSnapshot(
  page: Page,
  url: string,
  screen: ScreenSize,
  fileName?: string
): Promise<void> {
  await page.setViewportSize({ width: screen.width, height: screen.height });

  await stabilizePage(page, url);

  const snapshotName = fileName ?? `${currentLanguage}_${screen.name}.png`;

  await expect(page).toHaveScreenshot(snapshotName, SNAPSHOT_OPTIONS);
}

export default takeVisualSnapshot;
