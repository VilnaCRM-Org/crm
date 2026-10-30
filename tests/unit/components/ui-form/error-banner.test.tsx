import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';

import type { FocusReturnHandlers } from '@/components/types/ui-form';
import ErrorBanner from '@/components/ui-form/error-banner';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const ERROR_TEXT = 'Request failed';

const handlers = (): FocusReturnHandlers => ({ onFocus: jest.fn(), onBlur: jest.fn() });

function Harness({ focusReturn }: { focusReturn: FocusReturnHandlers }): JSX.Element {
  return (
    <>
      <ErrorBanner error={ERROR_TEXT} focusReturn={focusReturn} />
      <button type="button">Elsewhere</button>
    </>
  );
}

const bannerOf = (alert: HTMLElement): HTMLElement | undefined =>
  screen
    .getAllByRole('generic')
    .find((element) => element.tagName === 'SECTION' && element.contains(alert));

describe('ErrorBanner', () => {
  it('renders nothing without an error', () => {
    const { container } = render(<ErrorBanner error={null} focusReturn={handlers()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the alert inside a focused section so it never counts as a field-wrapper div', () => {
    render(<Harness focusReturn={handlers()} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(ERROR_TEXT);
    expect(bannerOf(alert)).toBeDefined();
    expect(bannerOf(alert)).toHaveFocus();
  });

  it('reports focus entering the section to the focus-return handlers', () => {
    const focusReturn = handlers();

    render(<Harness focusReturn={focusReturn} />);

    expect(focusReturn.onFocus).toHaveBeenCalledTimes(1);
    expect(focusReturn.onBlur).not.toHaveBeenCalled();
  });

  it('reports focus leaving the section with the element it moved to', async () => {
    const focusReturn = handlers();
    render(<Harness focusReturn={focusReturn} />);

    await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));

    expect(focusReturn.onBlur).toHaveBeenCalledTimes(1);
    expect(focusReturn.onBlur).toHaveBeenCalledWith(
      expect.objectContaining({ relatedTarget: screen.getByRole('button', { name: 'Elsewhere' }) })
    );
  });

  it('has no axe violations', async () => {
    const { container } = render(<Harness focusReturn={handlers()} />);

    await expectNoA11yViolations(container);
  });
});
