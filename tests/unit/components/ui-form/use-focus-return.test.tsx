import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type JSX, type RefObject } from 'react';

import useFocusReturn from '@/components/ui-form/use-focus-return';

function Probe({
  shown,
  target,
}: {
  shown: boolean;
  target: RefObject<HTMLButtonElement | null>;
}): JSX.Element {
  const handlers = useFocusReturn(shown, target);
  return (
    <>
      {shown && (
        <button type="button" onFocus={handlers.onFocus} onBlur={handlers.onBlur}>
          Transient
        </button>
      )}
      <button type="button" ref={target}>
        Target
      </button>
      <button type="button">Other</button>
    </>
  );
}

describe('useFocusReturn', () => {
  it('focuses the target when the focused element goes away', async () => {
    const target = createRef<HTMLButtonElement>();
    const { rerender } = render(<Probe shown target={target} />);
    await userEvent.click(screen.getByRole('button', { name: 'Transient' }));

    rerender(<Probe shown={false} target={target} />);

    expect(screen.getByRole('button', { name: 'Target' })).toHaveFocus();
  });

  it('does nothing when focus had moved elsewhere first', async () => {
    const target = createRef<HTMLButtonElement>();
    const { rerender } = render(<Probe shown target={target} />);
    await userEvent.click(screen.getByRole('button', { name: 'Transient' }));
    await userEvent.click(screen.getByRole('button', { name: 'Other' }));

    rerender(<Probe shown={false} target={target} />);

    expect(screen.getByRole('button', { name: 'Other' })).toHaveFocus();
  });

  it('does nothing when the element never held focus', () => {
    const target = createRef<HTMLButtonElement>();
    const { rerender } = render(<Probe shown target={target} />);

    rerender(<Probe shown={false} target={target} />);

    expect(screen.getByRole('button', { name: 'Target' })).not.toHaveFocus();
  });

  it('leaves focus where it is when something else already holds it', () => {
    const target = createRef<HTMLButtonElement>();
    const { rerender } = render(<Probe shown target={target} />);
    fireEvent.focus(screen.getByRole('button', { name: 'Transient' }));
    const other = screen.getByRole('button', { name: 'Other' });
    other.focus();

    rerender(<Probe shown={false} target={target} />);

    expect(other).toHaveFocus();
  });

  it('restores focus when the element itself drops focus to the page', async () => {
    const target = createRef<HTMLButtonElement>();
    const { rerender } = render(<Probe shown target={target} />);
    const transient = screen.getByRole('button', { name: 'Transient' });
    await userEvent.click(transient);
    transient.blur();

    rerender(<Probe shown={false} target={target} />);

    expect(screen.getByRole('button', { name: 'Target' })).toHaveFocus();
  });

  it('forgets the hold once focus moved on, even after it later drops to the page', async () => {
    const target = createRef<HTMLButtonElement>();
    const { rerender } = render(<Probe shown target={target} />);
    await userEvent.click(screen.getByRole('button', { name: 'Transient' }));
    const other = screen.getByRole('button', { name: 'Other' });
    await userEvent.click(other);
    other.blur();

    rerender(<Probe shown={false} target={target} />);

    expect(document.body).toHaveFocus();
  });

  it('is not armed by a blur the element never had focus for', () => {
    const target = createRef<HTMLButtonElement>();
    const { rerender } = render(<Probe shown target={target} />);
    fireEvent.blur(screen.getByRole('button', { name: 'Transient' }));

    rerender(<Probe shown={false} target={target} />);

    expect(document.body).toHaveFocus();
  });

  it('releases the hold after restoring, so the next hide moves nothing', async () => {
    const target = createRef<HTMLButtonElement>();
    const { rerender } = render(<Probe shown target={target} />);
    await userEvent.click(screen.getByRole('button', { name: 'Transient' }));
    rerender(<Probe shown={false} target={target} />);
    screen.getByRole('button', { name: 'Target' }).blur();

    rerender(<Probe shown target={target} />);
    rerender(<Probe shown={false} target={target} />);

    expect(document.body).toHaveFocus();
  });
});
