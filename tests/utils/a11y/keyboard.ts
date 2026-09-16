import { expect, type Locator, type Page } from '@playwright/test';

interface FocusStyle {
  outline: string;
  boxShadow: string;
  borderColor: string;
  backgroundColor: string;
}

const focusStyleOf = (target: Locator): Promise<FocusStyle> =>
  target.evaluate((element) => {
    const styled = element.matches('button, a, .MuiButtonBase-root')
      ? element
      : (element.closest('.MuiOutlinedInput-root')?.querySelector('fieldset') ?? element);
    const style = window.getComputedStyle(styled);
    return {
      outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`,
      boxShadow: style.boxShadow,
      borderColor: style.borderColor,
      backgroundColor: style.backgroundColor,
    };
  });

const describeActive = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const active = document.activeElement;
    if (!active) return 'nothing';
    const name = active.getAttribute('aria-label') ?? active.textContent?.trim().slice(0, 40) ?? '';
    return `${active.tagName.toLowerCase()}${active.id ? `#${active.id}` : ''} "${name}"`;
  });

export interface TabStop {
  locator: Locator;
  /** Also require the focused styling to differ from the resting styling (WCAG 2.4.7). */
  visibleFocus?: boolean;
}

/**
 * Presses Tab once and asserts `stop` is the element that received keyboard focus and that the
 * browser marks it `:focus-visible`; with `visibleFocus`, also that its styling changed.
 */
export async function expectNextTabStop(page: Page, stop: TabStop): Promise<void> {
  const resting = await focusStyleOf(stop.locator);
  await page.keyboard.press('Tab');

  const active = await describeActive(page);
  await expect(stop.locator, `Tab landed on ${active}`).toBeFocused();
  expect(
    await stop.locator.evaluate((element) => element.matches(':focus-visible')),
    `${active} is focused without :focus-visible`
  ).toBe(true);
  if (stop.visibleFocus) {
    expect(await focusStyleOf(stop.locator), `${active} shows no visible focus change`).not.toEqual(
      resting
    );
  }
}

/** Asserts that pressing Tab visits `stops` in exactly this order, one press per stop. */
export async function expectTabOrder(page: Page, stops: readonly TabStop[]): Promise<void> {
  expect(stops.length).toBeGreaterThan(0);
  for (const stop of stops) {
    await expectNextTabStop(page, stop);
  }
}
