import { render, screen } from '@testing-library/react';
import type { JSX } from 'react';

import useEscapeCancel from '@/modules/user/features/settings/hooks/use-escape-cancel';

function EscapeView({ cancel, disabled }: { cancel: () => void; disabled: boolean }): JSX.Element {
  const cancelRef = useEscapeCancel(cancel, disabled);

  return (
    <>
      <form aria-label="Confirmation">
        <input aria-label="Code" />
        <button ref={cancelRef} type="button">
          Cancel
        </button>
      </form>
      <button type="button">Elsewhere</button>
    </>
  );
}

function EscapeButtonOnly({ cancel }: { cancel: () => void }): JSX.Element {
  const cancelRef = useEscapeCancel(cancel, false);

  return (
    <button ref={cancelRef} type="button">
      Cancel
    </button>
  );
}

const pressOn = (target: EventTarget, key: string): void => {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
};

const insideView = (): HTMLElement => screen.getByRole('textbox', { name: 'Code' });

describe('useEscapeCancel', () => {
  it('calls cancel once for Escape pressed inside the view form', () => {
    const cancel = jest.fn();
    render(<EscapeView cancel={cancel} disabled={false} />);

    pressOn(insideView(), 'Escape');

    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('cancels from the Cancel button itself', () => {
    const cancel = jest.fn();
    render(<EscapeView cancel={cancel} disabled={false} />);

    pressOn(screen.getByRole('button', { name: 'Cancel' }), 'Escape');

    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('ignores Escape meant for a control outside the view', () => {
    const cancel = jest.fn();
    render(<EscapeView cancel={cancel} disabled={false} />);

    pressOn(screen.getByRole('button', { name: 'Elsewhere' }), 'Escape');
    pressOn(document, 'Escape');

    expect(cancel).not.toHaveBeenCalled();
  });

  it('ignores Escape when the Cancel button sits in no form', () => {
    const cancel = jest.fn();
    render(
      <>
        <input aria-label="Code" />
        <EscapeButtonOnly cancel={cancel} />
      </>
    );

    pressOn(insideView(), 'Escape');
    pressOn(screen.getByRole('button', { name: 'Cancel' }), 'Escape');

    expect(cancel).not.toHaveBeenCalled();
  });

  it.each(['Enter', 'Esc', 'a', ' '])('ignores %s', (key) => {
    const cancel = jest.fn();
    render(<EscapeView cancel={cancel} disabled={false} />);

    pressOn(insideView(), key);

    expect(cancel).not.toHaveBeenCalled();
  });

  it('stops listening after unmount', () => {
    const cancel = jest.fn();
    const { unmount } = render(<EscapeView cancel={cancel} disabled={false} />);
    const input = insideView();

    unmount();
    pressOn(input, 'Escape');

    expect(cancel).not.toHaveBeenCalled();
  });

  it('calls the latest cancel after a re-render, never the old one', () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = render(<EscapeView cancel={first} disabled={false} />);

    rerender(<EscapeView cancel={second} disabled={false} />);
    pressOn(insideView(), 'Escape');

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('ignores Escape while disabled', () => {
    const cancel = jest.fn();
    render(<EscapeView cancel={cancel} disabled />);

    pressOn(insideView(), 'Escape');

    expect(cancel).not.toHaveBeenCalled();
  });

  it('cancels on Escape again once it is no longer disabled', () => {
    const cancel = jest.fn();
    const { rerender } = render(<EscapeView cancel={cancel} disabled />);
    pressOn(insideView(), 'Escape');

    rerender(<EscapeView cancel={cancel} disabled={false} />);
    pressOn(insideView(), 'Escape');

    expect(cancel).toHaveBeenCalledTimes(1);
  });
});
