import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react';

import useNotificationFocusReturn from '@/hooks/use-notification-focus-return';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const button = (): HTMLButtonElement => {
  const element = document.createElement('button');
  document.body.appendChild(element);
  return element;
};

describe('useNotificationFocusReturn', () => {
  beforeEach(() => resetClientStores());

  afterEach(() => document.body.replaceChildren());

  it('focuses the published primary target', () => {
    const primary = button();
    useNotificationOutletStore.setState({ focus: { primary: { current: primary } } });
    const { result } = renderHook(() => useNotificationFocusReturn());

    result.current();

    expect(primary).toHaveFocus();
  });

  it.each(['disabled', 'detached'])(
    'falls back to the published fallback when the primary is %s',
    (state) => {
      const primary = button();
      const fallback = button();
      if (state === 'disabled') primary.disabled = true;
      else primary.remove();
      useNotificationOutletStore.setState({
        focus: { primary: { current: primary }, fallback: { current: fallback } },
      });
      const { result } = renderHook(() => useNotificationFocusReturn());

      result.current();

      expect(fallback).toHaveFocus();
    }
  );

  it('does nothing when no focus target was published', () => {
    const outside = button();
    outside.focus();
    const { result } = renderHook(() => useNotificationFocusReturn());

    result.current();

    expect(outside).toHaveFocus();
  });

  it('does nothing when the primary is unusable and there is no fallback', () => {
    const outside = button();
    const primary = button();
    primary.disabled = true;
    outside.focus();
    useNotificationOutletStore.setState({ focus: { primary: { current: primary } } });
    const { result } = renderHook(() => useNotificationFocusReturn());

    result.current();

    expect(outside).toHaveFocus();
  });

  it('keeps the same function until the published focus changes', () => {
    const { result, rerender } = renderHook(() => useNotificationFocusReturn());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
