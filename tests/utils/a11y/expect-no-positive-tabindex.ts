import { expect, type Page } from '@playwright/test';

const POSITIVE_TABINDEX = '[tabindex]:not([tabindex="0"]):not([tabindex="-1"])';

export default async function expectNoPositiveTabindex(page: Page): Promise<void> {
  await expect(page.locator(POSITIVE_TABINDEX)).toHaveCount(0);
}
