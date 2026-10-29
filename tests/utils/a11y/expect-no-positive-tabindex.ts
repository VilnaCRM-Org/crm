import { expect, type Page } from '@playwright/test';

export default async function expectNoPositiveTabindex(page: Page): Promise<void> {
  const positive = await page
    .locator('[tabindex]')
    .evaluateAll((nodes) =>
      nodes
        .filter(
          (node) => (node instanceof HTMLElement || node instanceof SVGElement) && node.tabIndex > 0
        )
        .map((node) => node.outerHTML)
    );

  expect(positive).toEqual([]);
}
