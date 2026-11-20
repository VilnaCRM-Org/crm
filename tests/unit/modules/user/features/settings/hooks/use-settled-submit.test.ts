import { act, renderHook, type RenderHookResult } from '@testing-library/react';

import useSettledSubmit from '@/modules/user/features/settings/hooks/use-settled-submit';
import type { SettledSubmit } from '@/modules/user/features/settings/types/hooks/two-factor-submit';

import {
  EMPTY_SETTINGS,
  failedOutcome,
  type TwoFactorOperationPlan,
  type TwoFactorSettingsOutcome,
} from './two-factor-test-deps';

const PLAN: TwoFactorOperationPlan = {
  view: 'codes',
  statusCode: null,
  record: null,
  failures: new Map(),
};

const CHANGED: TwoFactorSettingsOutcome = { kind: 'changed', settings: EMPTY_SETTINGS };

interface Mounted {
  readonly settle: jest.Mock;
  readonly result: RenderHookResult<SettledSubmit<string>, unknown>['result'];
  readonly unmount: () => void;
}

const mount = (run: jest.Mock, settle = jest.fn()): Mounted => ({
  settle,
  ...renderHook(() => useSettledSubmit<string>({ run, plan: PLAN, settle })),
});

describe('useSettledSubmit', () => {
  it('runs with the input and a live signal, then settles the outcome with the plan', async () => {
    const run = jest.fn().mockResolvedValue(CHANGED);
    const { result, settle } = mount(run);

    await act(async () => result.current.send('input'));

    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0]?.[0]).toBe('input');
    expect((run.mock.calls[0]?.[1] as AbortSignal).aborted).toBe(false);
    expect(settle).toHaveBeenCalledTimes(1);
    expect(settle).toHaveBeenCalledWith(CHANGED, PLAN);
  });

  it('settles a failed outcome too', async () => {
    const failed = failedOutcome('network');
    const { result, settle } = mount(jest.fn().mockResolvedValue(failed));

    await act(async () => result.current.send('input'));

    expect(settle).toHaveBeenCalledWith(failed, PLAN);
  });

  it('offers only send and the busy flag, with no resend of a captured input', () => {
    const { result } = mount(jest.fn());

    expect(Object.keys(result.current).sort()).toEqual(['isSubmitting', 'send']);
  });

  it('sends one request for two quick sends and reports busy', async () => {
    const run = jest.fn().mockReturnValue(new Promise(() => undefined));
    const { result } = mount(run);

    await act(async () => {
      result.current.send('a');
      result.current.send('b');
    });

    expect(run).toHaveBeenCalledTimes(1);
    expect(result.current.isSubmitting).toBe(true);
  });

  it('settles nothing for a run aborted by unmount', async () => {
    let release: (outcome: TwoFactorSettingsOutcome) => void = () => undefined;
    const run = jest.fn(
      () =>
        new Promise<TwoFactorSettingsOutcome>((resolve) => {
          release = resolve;
        })
    );
    const { result, settle, unmount } = mount(run);
    act(() => {
      result.current.send('input');
    });

    unmount();
    await act(async () => release(CHANGED));

    expect(settle).not.toHaveBeenCalled();
  });
});
