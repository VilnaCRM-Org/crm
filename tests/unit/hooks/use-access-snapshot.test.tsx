// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';

import useAccessSnapshot from '@/hooks/use-access-snapshot';
import accessState from '@/lib/access/access-state';
import { FEATURE_FLAGS } from '@/lib/access/feature-flag-catalog';
import { buildPrincipal } from '@tests/builders';

interface SubscriptionProbe {
  readonly notified: jest.Mock;
  readonly stopped: jest.Mock;
}

function trackSubscriptions(): SubscriptionProbe {
  const notified = jest.fn();
  const stopped = jest.fn();
  const realSubscribe = accessState.subscribe.bind(accessState);

  jest.spyOn(accessState, 'subscribe').mockImplementation((listener: () => void) => {
    const teardown = realSubscribe(() => {
      notified();
      listener();
    });
    return (): void => {
      stopped();
      teardown();
    };
  });

  return { notified, stopped };
}

describe('useAccessSnapshot', () => {
  beforeEach(() => {
    accessState.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    act(() => {
      accessState.clear();
    });
  });

  it('returns the current snapshot at mount time', () => {
    const principal = buildPrincipal();
    accessState.setSession(principal, { [FEATURE_FLAGS.contactsModule]: true });

    const { result } = renderHook(() => useAccessSnapshot());

    expect(result.current).toBe(accessState.get());
    expect(result.current.principal).toBe(principal);
    expect(result.current.flags).toEqual({ [FEATURE_FLAGS.contactsModule]: true });
  });

  it('returns the anonymous snapshot when no session was started', () => {
    const { result } = renderHook(() => useAccessSnapshot());

    expect(result.current.principal).toBeNull();
    expect(result.current.flags).toEqual({});
  });

  it('re-renders the consumer with the new snapshot when the state changes after mount', () => {
    let hookCalls = 0;
    const { result } = renderHook(() => {
      hookCalls += 1;
      return useAccessSnapshot();
    });
    const callsAtMount = hookCalls;
    expect(result.current.principal).toBeNull();

    const principal = buildPrincipal();
    act(() => {
      accessState.setSession(principal, { [FEATURE_FLAGS.dealsModule]: true });
    });

    expect(hookCalls).toBe(callsAtMount + 1);
    expect(result.current.principal).toBe(principal);
    expect(result.current.flags).toEqual({ [FEATURE_FLAGS.dealsModule]: true });
    expect(result.current).toBe(accessState.get());
  });

  it('keeps tracking every subsequent change, including a logout back to anonymous', () => {
    const { result } = renderHook(() => useAccessSnapshot());

    const first = buildPrincipal();
    act(() => {
      accessState.setSession(first, {});
    });
    expect(result.current.principal).toBe(first);

    const second = buildPrincipal();
    act(() => {
      accessState.setSession(second, {});
    });
    expect(result.current.principal).toBe(second);

    act(() => {
      accessState.clear();
    });
    expect(result.current.principal).toBeNull();
  });

  it('subscribes once on mount and unsubscribes from the store on unmount', () => {
    const { notified, stopped } = trackSubscriptions();
    let hookCalls = 0;
    const { unmount } = renderHook(() => {
      hookCalls += 1;
      return useAccessSnapshot();
    });

    act(() => {
      accessState.setSession(buildPrincipal(), {});
    });
    expect(notified).toHaveBeenCalledTimes(1);
    const callsBeforeUnmount = hookCalls;

    unmount();
    expect(stopped).toHaveBeenCalledTimes(1);

    act(() => {
      accessState.setSession(buildPrincipal(), {});
    });
    expect(notified).toHaveBeenCalledTimes(1);
    expect(hookCalls).toBe(callsBeforeUnmount);
  });
});
