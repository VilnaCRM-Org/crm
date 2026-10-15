import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type JSX, type RefObject } from 'react';

import ErrorBanner from '@/components/ui-form/error-banner';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const ERROR_TEXT = 'Request failed';

function Harness({
  error,
  returnFocusRef,
}: {
  error: string | null;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
}): JSX.Element {
  return (
    <>
      <ErrorBanner error={error} returnFocusRef={returnFocusRef} />
      <button type="button" ref={returnFocusRef}>
        Submit
      </button>
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
    const { container } = render(<ErrorBanner error={null} returnFocusRef={createRef()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the alert inside a focused section so it never counts as a field-wrapper div', () => {
    render(<Harness error={ERROR_TEXT} returnFocusRef={createRef()} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(ERROR_TEXT);
    expect(bannerOf(alert)).toBeDefined();
    expect(bannerOf(alert)).toHaveFocus();
  });

  it('moves focus to the return target when it disappears while focused', () => {
    const returnFocusRef = createRef<HTMLButtonElement>();
    const { rerender } = render(<Harness error={ERROR_TEXT} returnFocusRef={returnFocusRef} />);
    expect(bannerOf(screen.getByRole('alert'))).toHaveFocus();

    rerender(<Harness error={null} returnFocusRef={returnFocusRef} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toHaveFocus();
  });

  it('leaves focus alone when the user had already moved it', async () => {
    const returnFocusRef = createRef<HTMLButtonElement>();
    const { rerender } = render(<Harness error={ERROR_TEXT} returnFocusRef={returnFocusRef} />);
    await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));

    rerender(<Harness error={null} returnFocusRef={returnFocusRef} />);

    expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
  });

  it('restores focus only once per disappearance', () => {
    const returnFocusRef = createRef<HTMLButtonElement>();
    const { rerender } = render(<Harness error={ERROR_TEXT} returnFocusRef={returnFocusRef} />);
    rerender(<Harness error={null} returnFocusRef={returnFocusRef} />);
    screen.getByRole('button', { name: 'Submit' }).blur();

    rerender(<Harness error={null} returnFocusRef={returnFocusRef} />);

    expect(screen.getByRole('button', { name: 'Submit' })).not.toHaveFocus();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Harness error={ERROR_TEXT} returnFocusRef={createRef()} />);

    await expectNoA11yViolations(container);
  });
});
