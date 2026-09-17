import '../../setup';

import { act, renderHook } from '@testing-library/react';

import ReactiveVarFactory from '@/lib/state/reactive-var-factory';
import useReactiveVar from '@/lib/state/use-reactive-var';

interface Session {
  token: string | null;
  attempts: number;
}

describe('reactive var integration', () => {
  it('supports read, write and persistent notification end to end', () => {
    const variable = new ReactiveVarFactory().create<Session>({ token: null, attempts: 0 });
    const listener = jest.fn();
    const unsubscribe = variable.subscribe(listener);

    const next = { token: 'session', attempts: 1 };
    expect(variable(next)).toBe(next);
    expect(variable()).toBe(next);
    expect(listener).toHaveBeenCalledTimes(1);

    variable({ token: null, attempts: 2 });
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    variable({ token: 'again', attempts: 3 });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('skips notifications for same-reference writes', () => {
    const value = { token: 'stable', attempts: 0 };
    const variable = new ReactiveVarFactory().create(value);
    const listener = jest.fn();
    variable.subscribe(listener);

    expect(variable(value)).toBe(value);
    expect(listener).not.toHaveBeenCalled();
  });

  it('keeps notifying the remaining subscribers after one throws', () => {
    const variable = new ReactiveVarFactory().create<Session>({ token: null, attempts: 0 });
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const failure = new Error('listener failure');
    const failing = jest.fn(() => {
      throw failure;
    });
    const survivor = jest.fn();
    variable.subscribe(failing);
    variable.subscribe(survivor);

    try {
      expect(variable({ token: 'session', attempts: 1 })).toEqual({
        token: 'session',
        attempts: 1,
      });

      expect(failing).toHaveBeenCalledTimes(1);
      expect(survivor).toHaveBeenCalledTimes(1);
      expect(consoleError).toHaveBeenCalledWith(
        'ReactiveVar listener threw during notification',
        failure
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it('drives a React consumer through useReactiveVar and only on slice changes', () => {
    const variable = new ReactiveVarFactory().create<Session>({ token: null, attempts: 0 });
    let hookCalls = 0;
    const { result, unmount } = renderHook(() => {
      hookCalls += 1;
      return useReactiveVar(variable, (session: Session): string | null => session.token);
    });
    expect(result.current).toBeNull();

    act(() => {
      variable({ token: 'session', attempts: 1 });
    });
    expect(result.current).toBe('session');

    const callsAfterToken = hookCalls;
    act(() => {
      variable({ token: 'session', attempts: 2 });
    });
    expect(hookCalls).toBe(callsAfterToken);

    unmount();
    act(() => {
      variable({ token: 'after-unmount', attempts: 3 });
    });
    expect(variable().token).toBe('after-unmount');
  });
});
