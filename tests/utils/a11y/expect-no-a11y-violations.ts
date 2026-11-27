import { act } from '@testing-library/react';
import { axe } from 'jest-axe';

import applyA11yExceptions, { domElementMatcher } from './apply-a11y-exceptions';
import { JSDOM_INCAPABLE_RULES, WCAG_AA_TAGS } from './axe-config';

const disabledRules = Object.fromEntries(
  JSDOM_INCAPABLE_RULES.map((ruleId) => [ruleId, { enabled: false }])
);

/**
 * Component-level WCAG 2.1 AA gate for the jsdom Jest suite: runs axe over `container` with
 * the shared tag set and fails the test on any violation not covered by the allowlist. The scan
 * runs inside `act`, so a timer that updates the tree meanwhile (a MUI ripple's exit) is flushed.
 */
export default async function expectNoA11yViolations(container: Element): Promise<void> {
  const results = await act(async () => {
    const found = await axe(container, {
      runOnly: { type: 'tag', values: [...WCAG_AA_TAGS] },
      rules: disabledRules,
    });
    return applyA11yExceptions(found, domElementMatcher(container));
  });

  expect(results).toHaveNoViolations();
}
