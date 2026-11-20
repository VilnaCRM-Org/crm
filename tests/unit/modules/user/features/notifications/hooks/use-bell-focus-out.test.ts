import { renderHook } from '@testing-library/react';
import type { FocusEvent, RefObject } from 'react';

import useFocusOut from '@/modules/user/features/notifications/hooks/use-bell-focus-out';

const mount = (): { node: HTMLDivElement; inner: HTMLButtonElement; other: HTMLButtonElement } => {
  const node = document.createElement('div');
  const inner = document.createElement('button');
  const other = document.createElement('button');
  node.appendChild(inner);
  document.body.append(node, other);

  return { node, inner, other };
};

const focusEvent = (relatedTarget: Element | null): FocusEvent<HTMLElement> =>
  new FocusEvent('focusout', { relatedTarget }) as unknown as FocusEvent<HTMLElement>;

describe('useBellFocusOut', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('closes when focus moves to an element outside the wrapper', () => {
    const { node, other } = mount();
    const wrapper: RefObject<HTMLDivElement | null> = { current: node };
    const close = jest.fn();
    const { result } = renderHook(() => useFocusOut({ close, wrapper }));

    result.current(focusEvent(other));

    expect(close).toHaveBeenCalledTimes(1);
  });

  it('stays open when focus moves inside the wrapper or to nowhere', () => {
    const { node, inner } = mount();
    const wrapper: RefObject<HTMLDivElement | null> = { current: node };
    const close = jest.fn();
    const { result } = renderHook(() => useFocusOut({ close, wrapper }));

    result.current(focusEvent(inner));
    result.current(focusEvent(null));

    expect(close).not.toHaveBeenCalled();
  });

  it('treats an unmounted wrapper as outside', () => {
    const { other } = mount();
    const wrapper: RefObject<HTMLDivElement | null> = { current: null };
    const close = jest.fn();
    const { result } = renderHook(() => useFocusOut({ close, wrapper }));

    result.current(focusEvent(other));

    expect(close).toHaveBeenCalledTimes(1);
  });

  it('keeps one handler identity while its inputs are unchanged', () => {
    const wrapper: RefObject<HTMLDivElement | null> = { current: null };
    const close = jest.fn();
    const { result, rerender } = renderHook(() => useFocusOut({ close, wrapper }));
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
