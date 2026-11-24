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

const nowhere = { current: null };

describe('useNotificationFocusReturn', () => {
  beforeEach(() => resetClientStores());

  afterEach(() => document.body.replaceChildren());

  it('focuses the published primary target', () => {
    const primary = button();
    useNotificationOutletStore.setState({ focus: { primary: { current: primary } } });
    const { result } = renderHook(() => useNotificationFocusReturn(nowhere));

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
      const { result } = renderHook(() => useNotificationFocusReturn(nowhere));

      result.current();

      expect(fallback).toHaveFocus();
    }
  );

  it('focuses the last resort when no focus target was published', () => {
    const bell = button();
    const { result } = renderHook(() => useNotificationFocusReturn({ current: bell }));

    result.current();

    expect(bell).toHaveFocus();
  });

  it.each(['disabled', 'detached'])(
    'focuses the last resort when both published targets are %s',
    (state) => {
      const targets = [button(), button()];
      const [primary, fallback] = targets;
      targets.forEach((target) => {
        if (state === 'disabled') target.setAttribute('disabled', '');
        else target.remove();
      });
      const bell = button();
      useNotificationOutletStore.setState({
        focus: {
          primary: { current: primary as HTMLButtonElement },
          fallback: { current: fallback as HTMLButtonElement },
        },
      });
      const { result } = renderHook(() => useNotificationFocusReturn({ current: bell }));

      result.current();

      expect(bell).toHaveFocus();
    }
  );

  it('prefers a usable published target to the last resort', () => {
    const primary = button();
    const bell = button();
    useNotificationOutletStore.setState({ focus: { primary: { current: primary } } });
    const { result } = renderHook(() => useNotificationFocusReturn({ current: bell }));

    result.current();

    expect(primary).toHaveFocus();
  });

  it('does not focus a disabled last resort', () => {
    const outside = button();
    const bell = button();
    bell.disabled = true;
    outside.focus();
    const { result } = renderHook(() => useNotificationFocusReturn({ current: bell }));

    result.current();

    expect(outside).toHaveFocus();
  });

  it('follows a changed last resort', () => {
    const first = button();
    const second = button();
    const { result, rerender } = renderHook(
      (lastResort: { current: HTMLElement }) => useNotificationFocusReturn(lastResort),
      { initialProps: { current: first } }
    );

    rerender({ current: second });
    result.current();

    expect(second).toHaveFocus();
  });

  it('does nothing when nothing was published and there is no last resort', () => {
    const outside = button();
    outside.focus();
    const { result } = renderHook(() => useNotificationFocusReturn(nowhere));

    result.current();

    expect(outside).toHaveFocus();
  });

  it('does nothing when the primary is unusable and there is no fallback', () => {
    const outside = button();
    const primary = button();
    primary.disabled = true;
    outside.focus();
    useNotificationOutletStore.setState({ focus: { primary: { current: primary } } });
    const { result } = renderHook(() => useNotificationFocusReturn(nowhere));

    result.current();

    expect(outside).toHaveFocus();
  });

  it('keeps the same function until the published focus changes', () => {
    const { result, rerender } = renderHook(() => useNotificationFocusReturn(nowhere));
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
