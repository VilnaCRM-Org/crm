import { expect, type Locator, type Page } from '@playwright/test';

export const OVERFLOW_WIDTHS: readonly number[] = [320, 390, 412];
export const CONTAINMENT_WIDTHS: readonly number[] = [320, 360, 600, 767];
export const KEYBOARD_VIEWPORT_RATIO = 0.45;
export const MIN_SMALL_TARGET_PX = 24;
const TALL_VIEWPORT_HEIGHT = 900;

export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))
    .toBeLessThanOrEqual(0);
}

export async function resizeTo(page: Page, width: number): Promise<void> {
  await page.setViewportSize({ width, height: TALL_VIEWPORT_HEIGHT });
}

export async function expectInsideContentBox(
  container: Locator,
  itemSelector: string,
  count: number
): Promise<void> {
  const fit = await container.evaluate((root, selector) => {
    const style = getComputedStyle(root);
    const box = root.getBoundingClientRect();
    const left = box.left + parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth);
    const right = box.right - parseFloat(style.paddingRight) - parseFloat(style.borderRightWidth);
    const items = Array.from(root.querySelectorAll(selector)).map((item) =>
      item.getBoundingClientRect()
    );
    return {
      count: items.length,
      outside: items.filter((item) => item.left < left - 0.5 || item.right > right + 0.5).length,
    };
  }, itemSelector);

  expect(fit).toEqual({ count, outside: 0 });
}

export async function expectReachableAtKeyboardHeight(
  page: Page,
  field: Locator,
  submit: Locator
): Promise<void> {
  const size = page.viewportSize();
  await field.tap();
  await page.setViewportSize({
    width: size?.width ?? 390,
    height: Math.round((size?.height ?? 664) * KEYBOARD_VIEWPORT_RATIO),
  });

  await submit.scrollIntoViewIfNeeded();

  await expect(submit).toBeInViewport();
}

export async function expectNoMotionOf(page: Page, targets: readonly Locator[]): Promise<void> {
  const scroll = await page.evaluate(
    () => getComputedStyle(document.documentElement).scrollBehavior
  );
  expect(scroll).not.toBe('smooth');
  for (const target of targets) {
    await expect(target).toHaveCSS('transition-duration', '0s');
    await expect(target).toHaveCSS('animation-name', 'none');
  }
}
