import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react';

import type { ToastItemSet } from '@/components/types/ui-toast';
import type { ToastFocus, ToastFocusOptions } from '@/components/types/ui-toast/toast-focus';
import useToastFocus from '@/components/ui-toast/use-toast-focus';

const twoToasts: ToastItemSet = {
  items: [
    { id: 1, tone: 'success', message: 'Перше' },
    { id: 2, tone: 'error', message: 'Друге' },
  ],
};

const button = (label: string): HTMLButtonElement => {
  const node = document.createElement('button');
  node.textContent = label;
  document.body.append(node);
  return node;
};

type Mounted = ReturnType<typeof renderHook<ToastFocus, undefined>>;

const mount = (overrides: Partial<ToastFocusOptions> = {}): Mounted => {
  const options: ToastFocusOptions = {
    toasts: twoToasts,
    returnFocusRef: { current: null },
    onDismiss: jest.fn(),
    ...overrides,
  };
  return renderHook(() => useToastFocus(options));
};

const mountFocus = (overrides: Partial<ToastFocusOptions> = {}): ToastFocus =>
  mount(overrides).result.current;

describe('useToastFocus', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('moves focus to a registered neighbour close button before dismissing', () => {
    const onDismiss = jest.fn();
    const close = button('close 2');
    const focus = jest.spyOn(close, 'focus');
    const toastFocus = mountFocus({ onDismiss });
    toastFocus.closeRef(2)(close);

    toastFocus.dismiss(1);

    expect(close).toHaveFocus();
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith(1);
    expect(focus.mock.invocationCallOrder[0]).toBeLessThan(
      onDismiss.mock.invocationCallOrder[0] ?? 0
    );
  });

  it('moves focus to the previous close button when the dismissed toast is the last one', () => {
    const close1 = button('close 1');
    const close2 = button('close 2');
    const toastFocus = mountFocus();
    toastFocus.closeRef(1)(close1);
    toastFocus.closeRef(2)(close2);

    toastFocus.dismiss(2);

    expect(close1).toHaveFocus();
    expect(close2).not.toHaveFocus();
  });

  it('prefers the next close button over the previous one for a middle toast', () => {
    const close1 = button('close 1');
    const close2 = button('close 2');
    const close3 = button('close 3');
    const toastFocus = mountFocus({
      toasts: {
        items: [
          { id: 1, tone: 'success', message: 'Перше' },
          { id: 2, tone: 'error', message: 'Друге' },
          { id: 3, tone: 'success', message: 'Третє' },
        ],
      },
    });
    toastFocus.closeRef(1)(close1);
    toastFocus.closeRef(2)(close2);
    toastFocus.closeRef(3)(close3);

    toastFocus.dismiss(2);

    expect(close3).toHaveFocus();
    expect(close1).not.toHaveFocus();
    expect(close2).not.toHaveFocus();
  });

  it('moves no focus for an id that is not in the set, and still dismisses it', () => {
    const onDismiss = jest.fn();
    const save = button('save');
    const close1 = button('close 1');
    const close2 = button('close 2');
    const toastFocus = mountFocus({ onDismiss, returnFocusRef: { current: save } });
    toastFocus.closeRef(1)(close1);
    toastFocus.closeRef(2)(close2);

    toastFocus.dismiss(9);

    expect(document.body).toHaveFocus();
    expect(close1).not.toHaveFocus();
    expect(save).not.toHaveFocus();
    expect(onDismiss).toHaveBeenCalledWith(9);
  });

  it('falls back to the return target when the neighbour close button is not registered', () => {
    const save = button('save');
    const toastFocus = mountFocus({ returnFocusRef: { current: save } });

    toastFocus.dismiss(1);

    expect(save).toHaveFocus();
  });

  it('hands out one ref callback per toast id for the whole mount', () => {
    const { result, rerender } = mount();
    const first = result.current.closeRef(1);
    const second = result.current.closeRef(2);

    rerender();

    expect(result.current.closeRef(1)).toBe(first);
    expect(result.current.closeRef(2)).toBe(second);
    expect(first).not.toBe(second);
  });

  it('forgets a close button once its cleanup runs and hands out a fresh callback', () => {
    const save = button('save');
    const close = button('close 2');
    const toastFocus = mountFocus({ returnFocusRef: { current: save } });
    const closeRef = toastFocus.closeRef(2);
    const cleanup = closeRef(close);

    expect(typeof cleanup).toBe('function');
    (cleanup as () => void)();
    toastFocus.dismiss(1);

    expect(save).toHaveFocus();
    expect(close).not.toHaveFocus();
    expect(toastFocus.closeRef(2)).not.toBe(closeRef);
  });

  it('skips a disabled return target for the fallback', () => {
    const save = button('save');
    save.disabled = true;
    const heading = document.createElement('h1');
    heading.tabIndex = -1;
    document.body.append(heading);
    const toastFocus = mountFocus({
      toasts: { items: [{ id: 5, tone: 'success', message: 'Одне' }] },
      returnFocusRef: { current: save },
      fallbackFocusRef: { current: heading },
    });

    toastFocus.dismiss(5);

    expect(heading).toHaveFocus();
  });

  it('dismisses without throwing when no target can take focus', () => {
    const onDismiss = jest.fn();
    const toastFocus = mountFocus({ toasts: { items: [] }, onDismiss });

    expect(() => toastFocus.dismiss(9)).not.toThrow();
    expect(onDismiss).toHaveBeenCalledWith(9);
    expect(document.body).toHaveFocus();
  });

  it('dismisses without throwing when the fallback ref is empty', () => {
    const onDismiss = jest.fn();
    const toastFocus = mountFocus({
      toasts: { items: [{ id: 3, tone: 'success', message: 'Одне' }] },
      onDismiss,
      fallbackFocusRef: { current: null },
    });

    expect(() => toastFocus.dismiss(3)).not.toThrow();
    expect(onDismiss).toHaveBeenCalledWith(3);
  });

  describe('a toast pushed out by the cap while it holds focus', () => {
    const toast = (id: number): ToastItemSet['items'][number] => ({
      id,
      tone: 'success',
      message: `Сповіщення ${id}`,
    });
    const before: ToastItemSet = { items: [toast(1), toast(2), toast(3)] };
    const after: ToastItemSet = { items: [toast(2), toast(3), toast(4)] };

    interface Eviction {
      readonly settle: () => void;
      readonly next: HTMLButtonElement;
      readonly newest: HTMLButtonElement;
    }

    type PickFocus = (first: HTMLElement, close: HTMLButtonElement) => HTMLElement;

    const evictFirst = (focusedInFirst: PickFocus): Eviction => {
      const { result, rerender } = renderHook(
        ({ toasts }: { toasts: ToastItemSet }) =>
          useToastFocus({ toasts, returnFocusRef: { current: null }, onDismiss: jest.fn() }),
        { initialProps: { toasts: before } }
      );
      const first = document.createElement('div');
      const close1 = document.createElement('button');
      first.append(close1);
      document.body.append(first);
      const next = button('close 2');
      button('close 3');
      const detach = result.current.closeRef(1)(close1);
      result.current.closeRef(2)(next);
      focusedInFirst(first, close1).focus();
      (detach as () => void)();
      first.remove();
      const newest = button('close 4');
      result.current.closeRef(4)(newest);
      return { settle: (): void => rerender({ toasts: after }), next, newest };
    };

    const closeButtonOf: PickFocus = (_first, close) => close;

    const actionButtonOf: PickFocus = (first) => {
      const action = document.createElement('button');
      action.textContent = 'action 1';
      first.prepend(action);
      return action;
    };

    it('hands focus to the newest close button, not the next one, once it fell to the body', () => {
      const { settle, next, newest } = evictFirst(closeButtonOf);

      settle();

      expect(newest).toHaveFocus();
      expect(next).not.toHaveFocus();
    });

    it('treats a focused action button before the close button as held focus', () => {
      const { settle, newest } = evictFirst(actionButtonOf);

      settle();

      expect(newest).toHaveFocus();
    });

    it('does not override focus another control took in the same commit', () => {
      const { settle, newest } = evictFirst(closeButtonOf);
      const elsewhere = button('elsewhere');
      elsewhere.focus();

      settle();

      expect(elsewhere).toHaveFocus();
      expect(newest).not.toHaveFocus();
    });
  });
});
