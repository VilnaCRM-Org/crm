import { expect, type Page } from '@playwright/test';

import expectNoAxeViolations from './expect-no-axe-violations';

const POSITIVE_TABINDEX = '[tabindex]:not([tabindex="0"]):not([tabindex="-1"])';

/**
 * State-level WCAG 2.1 AA gate: the allowlisted axe scan plus the rule axe cannot express, that no
 * element declares a positive `tabindex`.
 */
export default async function expectCleanScan(page: Page): Promise<void> {
  await expectNoAxeViolations(page);
  await expect(page.locator(POSITIVE_TABINDEX)).toHaveCount(0);
}
