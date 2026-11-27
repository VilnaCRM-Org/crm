import { fireEvent, render, screen } from '@testing-library/react';
import { type JSX, useRef } from 'react';

import useBellDismissal from '@/modules/user/features/notifications/hooks/use-bell-dismissal';

interface HarnessProps {
  readonly expanded: boolean;
  readonly close: () => void;
}

function Harness({ expanded, close }: HarnessProps): JSX.Element {
  const bell = useRef<HTMLButtonElement>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const { focusOut } = useBellDismissal({ expanded, close, bell, wrapper });

  return (
    <div>
      <div ref={wrapper} role="presentation" onBlur={focusOut}>
        <button ref={bell} type="button">
          bell
        </button>
        <button type="button">inside</button>
      </div>
      <button type="button">outside</button>
    </div>
  );
}

const renderOpen = (expanded = true): { close: jest.Mock; rerender: (open: boolean) => void } => {
  const close = jest.fn();
  const view = render(<Harness expanded={expanded} close={close} />);

  return {
    close,
    rerender: (open): void => view.rerender(<Harness expanded={open} close={close} />),
  };
};

describe('useBellDismissal', () => {
  afterEach(() => jest.restoreAllMocks());

  describe('Escape', () => {
    it('closes from inside the panel and moves focus to the bell', () => {
      const { close } = renderOpen();
      screen.getByText('inside').focus();

      fireEvent.keyDown(screen.getByText('inside'), { key: 'Escape' });

      expect(close).toHaveBeenCalledTimes(1);
      expect(screen.getByText('bell')).toHaveFocus();
    });

    it('closes from the bell itself', () => {
      const { close } = renderOpen();

      fireEvent.keyDown(screen.getByText('bell'), { key: 'Escape' });

      expect(close).toHaveBeenCalledTimes(1);
      expect(screen.getByText('bell')).toHaveFocus();
    });

    it('does nothing while closed, and for any other key', () => {
      const { close: closedClose } = renderOpen(false);
      screen.getByText('inside').focus();
      fireEvent.keyDown(screen.getByText('inside'), { key: 'Escape' });
      expect(closedClose).not.toHaveBeenCalled();
      expect(screen.getByText('inside')).toHaveFocus();
    });

    it('follows the latest open state and the latest close', () => {
      const first = jest.fn();
      const second = jest.fn();
      const view = render(<Harness expanded={false} close={first} />);

      view.rerender(<Harness expanded close={second} />);
      fireEvent.keyDown(screen.getByText('inside'), { key: 'Escape' });

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
      expect(screen.getByText('bell')).toHaveFocus();
    });

    it.each([
      ['the body', (): Element => document.body],
      ['the document element', (): Element => document.documentElement],
    ])('closes when nothing holds focus and the key lands on %s', (_label, target) => {
      const { close } = renderOpen();

      fireEvent.keyDown(target(), { key: 'Escape' });

      expect(close).toHaveBeenCalledTimes(1);
      expect(screen.getByText('bell')).toHaveFocus();
    });

    it('leaves the panel and focus alone when another control takes the key', () => {
      const { close } = renderOpen();
      const focus = jest.spyOn(HTMLElement.prototype, 'focus');

      fireEvent.keyDown(screen.getByText('outside'), { key: 'Escape' });

      expect(close).not.toHaveBeenCalled();
      expect(focus).not.toHaveBeenCalled();
    });

    it('ignores a key that an overlay inside stopped', () => {
      const { close } = renderOpen();
      const inside = screen.getByText('inside');
      inside.addEventListener('keydown', (event) => event.stopPropagation());

      fireEvent.keyDown(inside, { key: 'Escape' });

      expect(close).not.toHaveBeenCalled();
    });

    it('ignores the key on the document itself', () => {
      const { close } = renderOpen();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(close).not.toHaveBeenCalled();
    });

    it('stops listening once closed and once unmounted', () => {
      const close = jest.fn();
      const view = render(<Harness expanded close={close} />);
      view.rerender(<Harness expanded={false} close={close} />);
      fireEvent.keyDown(document.body, { key: 'Escape' });
      view.rerender(<Harness expanded close={close} />);
      view.unmount();
      fireEvent.keyDown(document.body, { key: 'Escape' });

      expect(close).not.toHaveBeenCalled();
    });

    it('ignores any other key while open', () => {
      const { close } = renderOpen();

      fireEvent.keyDown(screen.getByText('inside'), { key: 'Enter' });

      expect(close).not.toHaveBeenCalled();
    });
  });

  describe('pointerdown outside', () => {
    it.each([
      ['the body', (): Element => document.body],
      ['a page button', (): Element => screen.getByText('outside')],
    ])('closes on %s and moves no focus', (_label, target) => {
      const focus = jest.spyOn(HTMLElement.prototype, 'focus');
      const { close } = renderOpen();

      fireEvent.pointerDown(target());

      expect(close).toHaveBeenCalledTimes(1);
      expect(focus).not.toHaveBeenCalled();
    });

    it('stays open for a pointerdown inside the wrapper', () => {
      const { close } = renderOpen();

      fireEvent.pointerDown(screen.getByText('inside'));
      fireEvent.pointerDown(screen.getByText('bell'));

      expect(close).not.toHaveBeenCalled();
    });

    it('does nothing while closed', () => {
      const { close } = renderOpen(false);

      fireEvent.pointerDown(document.body);

      expect(close).not.toHaveBeenCalled();
    });

    it('adds one capture listener while open and removes that same handler on close', () => {
      const add = jest.spyOn(document, 'addEventListener');
      const remove = jest.spyOn(document, 'removeEventListener');
      const { rerender } = renderOpen(false);
      expect(add).not.toHaveBeenCalledWith('pointerdown', expect.anything(), true);

      rerender(true);
      const added = add.mock.calls.find(([type]) => type === 'pointerdown');
      expect(added?.[2]).toBe(true);
      expect(remove).not.toHaveBeenCalledWith('pointerdown', added?.[1], true);

      rerender(false);
      expect(remove).toHaveBeenCalledWith('pointerdown', added?.[1], true);
    });

    it('removes the listener on unmount', () => {
      const remove = jest.spyOn(document, 'removeEventListener');
      const close = jest.fn();
      const { unmount } = render(<Harness expanded close={close} />);

      unmount();

      expect(remove).toHaveBeenCalledWith('pointerdown', expect.any(Function), true);
      fireEvent.pointerDown(document.body);
      expect(close).not.toHaveBeenCalled();
    });
  });

  describe('focusout', () => {
    it('closes without moving focus when focus leaves the wrapper', () => {
      const focus = jest.spyOn(HTMLElement.prototype, 'focus');
      const { close } = renderOpen();

      fireEvent.blur(screen.getByText('inside'), { relatedTarget: screen.getByText('outside') });

      expect(close).toHaveBeenCalledTimes(1);
      expect(focus).not.toHaveBeenCalled();
    });

    it('stays open when focus moves inside the wrapper or to nowhere', () => {
      const { close } = renderOpen();

      fireEvent.blur(screen.getByText('inside'), { relatedTarget: screen.getByText('bell') });
      fireEvent.blur(screen.getByText('inside'), { relatedTarget: null });

      expect(close).not.toHaveBeenCalled();
    });
  });

  describe('focusin', () => {
    it('closes without moving focus when focus arrives outside from nowhere', () => {
      const { close } = renderOpen();

      screen.getByText('outside').focus();

      expect(close).toHaveBeenCalledTimes(1);
      expect(screen.getByText('outside')).toHaveFocus();
    });

    it('stays open when focus arrives inside', () => {
      const { close } = renderOpen();

      screen.getByText('inside').focus();
      screen.getByText('bell').focus();

      expect(close).not.toHaveBeenCalled();
    });

    it('ignores an arrival that its control stopped', () => {
      const { close } = renderOpen();
      const outside = screen.getByText('outside');
      outside.addEventListener('focusin', (event) => event.stopPropagation());

      outside.focus();

      expect(close).not.toHaveBeenCalled();
    });

    it('closes through the latest close', () => {
      const [first, second] = [jest.fn(), jest.fn()];
      const view = render(<Harness expanded close={first} />);
      view.rerender(<Harness expanded close={second} />);

      screen.getByText('outside').focus();

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
    });

    it('listens only while open', () => {
      const { close, rerender } = renderOpen();
      rerender(false);

      screen.getByText('outside').focus();

      expect(close).not.toHaveBeenCalled();
    });
  });
});
