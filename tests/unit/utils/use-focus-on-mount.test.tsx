import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { JSX } from 'react';

import useFocusOnMount from '@/utils/use-focus-on-mount';

const CONFIRM_LABEL = 'Confirm';
const CANCEL_LABEL = 'Cancel';

function FocusProbe({ label }: { label: string }): JSX.Element {
  const focusOnMount = useFocusOnMount<HTMLButtonElement>();

  return (
    <button type="button" ref={focusOnMount}>
      {label}
    </button>
  );
}

function TwoButtonProbe(): JSX.Element {
  const focusOnMount = useFocusOnMount<HTMLButtonElement>();

  return (
    <>
      <button type="button">{CANCEL_LABEL}</button>
      <button type="button" ref={focusOnMount}>
        {CONFIRM_LABEL}
      </button>
    </>
  );
}

describe('useFocusOnMount', () => {
  it('focuses the element the returned ref callback receives', () => {
    render(<FocusProbe label={CONFIRM_LABEL} />);

    expect(screen.getByRole('button', { name: CONFIRM_LABEL })).toHaveFocus();
  });

  it('focuses only the element the ref callback is attached to', () => {
    render(<TwoButtonProbe />);

    expect(screen.getByRole('button', { name: CONFIRM_LABEL })).toHaveFocus();
    expect(screen.getByRole('button', { name: CANCEL_LABEL })).not.toHaveFocus();
  });

  it('accepts the null node React passes on detach without throwing', () => {
    const view = render(<FocusProbe label={CONFIRM_LABEL} />);

    expect(() => view.unmount()).not.toThrow();
  });

  it('returns the same memoized ref callback across re-renders', () => {
    const received: Array<(node: HTMLButtonElement | null) => void> = [];

    function CallbackProbe({ label }: { label: string }): JSX.Element {
      const focusOnMount = useFocusOnMount<HTMLButtonElement>();
      received.push(focusOnMount);

      return (
        <button type="button" ref={focusOnMount}>
          {label}
        </button>
      );
    }

    const view = render(<CallbackProbe label={CONFIRM_LABEL} />);
    view.rerender(<CallbackProbe label={CANCEL_LABEL} />);

    expect(received).toHaveLength(2);
    expect(received[1]).toBe(received[0]);
    expect(screen.getByRole('button', { name: CANCEL_LABEL })).toHaveFocus();
  });
});
