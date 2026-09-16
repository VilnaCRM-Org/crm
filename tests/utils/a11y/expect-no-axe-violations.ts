import { AxeBuilder } from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

import applyA11yExceptions from './apply-a11y-exceptions';
import type { ElementMatcher } from './apply-a11y-exceptions';
import { WCAG_AA_TAGS } from './axe-config';

const pageElementMatcher =
  (page: Page): ElementMatcher =>
  (target, selector) =>
    page.evaluate(
      ([axeTarget, exceptionSelector]) =>
        document.querySelector(axeTarget)?.matches(exceptionSelector) ?? false,
      [target, selector] as const
    );

/**
 * Route-level WCAG 2.1 AA gate for the Playwright suites: scans the current document with the
 * shared tag set and fails on any violation not covered by the allowlist.
 */
export default async function expectNoAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags([...WCAG_AA_TAGS]).analyze();
  const { violations } = await applyA11yExceptions(results, pageElementMatcher(page));

  expect(
    violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.helpUrl,
      targets: violation.nodes.map((node) => node.target),
    })),
    'WCAG 2.1 AA axe violations'
  ).toEqual([]);
}
