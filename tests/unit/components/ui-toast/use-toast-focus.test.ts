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

const mountFocus = (overrides: Partial<ToastFocusOptions> = {}): ToastFocus => {
  const options: ToastFocusOptions = {
    toasts: twoToasts,
    returnFocusRef: { current: null },
    onDismiss: jest.fn(),
    ...overrides,
  };
  return renderHook(() => useToastFocus(options)).result.current;
};

describe('useToastFocus', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('moves focus to a registered neighbour close button before dismissing', () => {
    const onDismiss = jest.fn();
    const close = button('close 2');
    const toastFocus = mountFocus({ onDismiss });
    toastFocus.closeRef(2)(close);

    toastFocus.dismiss(1);

    expect(close).toHaveFocus();
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith(1);
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

  it('falls back to the return target when the neighbour close button is not registered', () => {
    const save = button('save');
    const toastFocus = mountFocus({ returnFocusRef: { current: save } });

    toastFocus.dismiss(1);

    expect(save).toHaveFocus();
  });

  it('forgets a close button once its cleanup runs', () => {
    const save = button('save');
    const close = button('close 2');
    const toastFocus = mountFocus({ returnFocusRef: { current: save } });
    const cleanup = toastFocus.closeRef(2)(close);

    expect(typeof cleanup).toBe('function');
    (cleanup as () => void)();
    toastFocus.dismiss(1);

    expect(save).toHaveFocus();
    expect(close).not.toHaveFocus();
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
      toasts: { items: [] },
      onDismiss,
      fallbackFocusRef: { current: null },
    });

    expect(() => toastFocus.dismiss(3)).not.toThrow();
    expect(onDismiss).toHaveBeenCalledWith(3);
  });
});
