import { Page, expect } from '@playwright/test';

import { currentLanguage } from '@tests/visual/constants';
import stabilizePage from '@tests/visual/stabilize-page';

async function takeMobileSnapshot(
  page: Page,
  url: string,
  name: string,
  readyLabel?: string
): Promise<void> {
  await stabilizePage(page, url);
  if (readyLabel !== undefined) await expect(page.getByLabel(readyLabel)).toBeVisible();

  await expect(page).toHaveScreenshot(`${currentLanguage}_${name}.png`, {
    fullPage: true,
    animations: 'disabled',
    scale: 'device',
  });
}

export default takeMobileSnapshot;
