import type { Page } from '@playwright/test';

import expectNoAxeViolations from './expect-no-axe-violations';
import expectNoPositiveTabindex from './expect-no-positive-tabindex';

/**
 * State-level WCAG 2.1 AA gate: the allowlisted axe scan plus the rule axe cannot express, that no
 * element declares a positive `tabindex`.
 */
export default async function expectCleanScan(page: Page): Promise<void> {
  await expectNoAxeViolations(page);
  await expectNoPositiveTabindex(page);
}
