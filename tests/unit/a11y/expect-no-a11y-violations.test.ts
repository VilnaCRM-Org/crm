import { render, screen } from '@testing-library/react';
import { createElement, useEffect, useState, type ReactElement } from 'react';

import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const SCAN_MS = 60;
const UPDATE_MS = 10;

jest.mock('jest-axe', () => {
  const actual = jest.requireActual<typeof import('jest-axe')>('jest-axe');
  const axe: typeof actual.axe = async (...args) => {
    await new Promise((resolve) => {
      setTimeout(resolve, SCAN_MS);
    });
    return actual.axe(...args);
  };
  return { ...actual, axe };
});

function LateUpdate({ named }: { named: boolean }): ReactElement {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(true), UPDATE_MS);
    return (): void => clearTimeout(timer);
  }, []);
  return createElement(
    'div',
    null,
    createElement('button', { type: 'button', 'aria-label': named ? 'Save' : '' }),
    createElement('p', null, settled ? 'settled' : 'pending')
  );
}

describe('a state update that lands while axe is scanning', () => {
  it('is wrapped in act, so a slow scan never fails on it', async () => {
    const consoleError = jest.spyOn(console, 'error');
    const { container } = render(createElement(LateUpdate, { named: true }));

    await expectNoA11yViolations(container);

    expect(consoleError).not.toHaveBeenCalled();
    expect(screen.getByText('settled')).toBeInTheDocument();
  });

  it('never hides a violation', async () => {
    const { container } = render(createElement(LateUpdate, { named: false }));

    await expect(expectNoA11yViolations(container)).rejects.toThrow(/button-name/);
  });
});
