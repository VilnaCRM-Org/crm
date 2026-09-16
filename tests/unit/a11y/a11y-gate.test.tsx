import { render } from '@testing-library/react';

import applyA11yExceptions, { domElementMatcher } from '@tests/utils/a11y/apply-a11y-exceptions';
import { A11Y_EXCEPTIONS, JSDOM_INCAPABLE_RULES, WCAG_AA_TAGS } from '@tests/utils/a11y/axe-config';
import type { A11yException } from '@tests/utils/a11y/axe-config';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const violation = (
  id: string,
  ...targets: string[]
): { id: string; nodes: { target: string[] }[] } => ({
  id,
  nodes: targets.map((target) => ({ target: [target] })),
});

describe('the component-level axe gate really fails (issue #118)', () => {
  it('rejects a button with no accessible name', async () => {
    const { container } = render(<button type="button" aria-label="" />);

    await expect(expectNoA11yViolations(container)).rejects.toThrow(/button-name/);
  });

  it('rejects an image without alternative text', async () => {
    const host = document.createElement('div');
    const image = document.createElement('img');
    image.src = 'hero.png';
    host.append(image);
    document.body.append(host);

    await expect(expectNoA11yViolations(host)).rejects.toThrow(/image-alt/);
    host.remove();
  });

  it('accepts the same button once it has a name', async () => {
    const { container } = render(
      <button type="button" aria-label="Close dialog">
        ×
      </button>
    );

    await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
  });
});

describe('the WCAG tag set and the jsdom carve-out', () => {
  it('binds the gate to WCAG 2.1 A + AA and nothing advisory', () => {
    expect([...WCAG_AA_TAGS]).toEqual(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
  });

  it('carves out only the two rules jsdom cannot evaluate', () => {
    expect([...JSDOM_INCAPABLE_RULES]).toEqual(['color-contrast', 'link-in-text-block']);
  });
});

describe('the exception allowlist', () => {
  it('carries a rule id, a scoped selector, a reason and a tracking issue on every entry', () => {
    for (const exception of A11Y_EXCEPTIONS) {
      expect(exception.ruleId).toMatch(/^[a-z][a-z0-9-]+$/);
      expect(exception.selector).not.toBe('*');
      expect(exception.selector.length).toBeGreaterThan(3);
      expect(exception.reason.length).toBeGreaterThan(20);
      expect(exception.trackingUrl).toMatch(
        /^https:\/\/github\.com\/VilnaCRM-Org\/crm\/issues\/\d+$/
      );
    }
  });

  it('removes only the node whose element matches the rule and the selector', async () => {
    const { container } = render(
      <div>
        <button type="button" id="excepted" className="MuiButton-contained" />
        <button type="button" id="kept" />
      </div>
    );
    const exceptions: A11yException[] = [
      {
        ruleId: 'color-contrast',
        selector: 'button.MuiButton-contained',
        reason: 'fixture entry with an adequately long reason',
        trackingUrl: 'https://github.com/VilnaCRM-Org/crm/issues/1',
      },
    ];

    const filtered = await applyA11yExceptions(
      {
        violations: [
          violation('color-contrast', '#excepted', '#kept'),
          violation('button-name', '#excepted'),
        ],
      },
      domElementMatcher(container),
      exceptions
    );

    expect(filtered.violations).toEqual([
      violation('color-contrast', '#kept'),
      violation('button-name', '#excepted'),
    ]);
  });

  it('never honours a wildcard selector', async () => {
    const { container } = render(<button type="button" id="any" />);
    const wildcard: A11yException[] = [
      {
        ruleId: 'button-name',
        selector: '*',
        reason: 'a wildcard must never silence a rule repository-wide',
        trackingUrl: 'https://github.com/VilnaCRM-Org/crm/issues/1',
      },
    ];

    const filtered = await applyA11yExceptions(
      { violations: [violation('button-name', '#any')] },
      domElementMatcher(container),
      wildcard
    );

    expect(filtered.violations).toEqual([violation('button-name', '#any')]);
  });
});
