import { expect, type Locator } from '@playwright/test';

import { MIN_TOUCH_TARGET_PX } from '@tests/e2e/mobile/constants';

export default async function expectTouchTarget(
  locator: Locator,
  name: string,
  minimum: number = MIN_TOUCH_TARGET_PX
): Promise<void> {
  await expect(locator, `${name} must be visible to be tappable`).toBeVisible();

  const box = await locator.boundingBox();
  expect(box, `${name} must have a layout box`).not.toBeNull();

  const width = box?.width ?? 0;
  const height = box?.height ?? 0;

  expect(width, `${name} touch width (CSS px)`).toBeGreaterThanOrEqual(minimum);
  expect(height, `${name} touch height (CSS px)`).toBeGreaterThanOrEqual(minimum);
}
