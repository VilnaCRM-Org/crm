import { act, renderHook } from '@testing-library/react';
import * as React from 'react';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import ROUTE_PATHS from '@/routes/route-paths';
import useChallengeSubmit from '@auth/hooks/use-challenge-submit';
import type { AuthProviderLoader } from '@auth/stores';
import useAuthStore, { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import type { ChallengeFailureReason, ChallengeResult } from '@auth/types/two-factor/challenge';
import type { ChallengeSubmitHookDeps } from '@auth/types/two-factor/challenge-view';
import { buildPendingSessionId, buildToken, buildTotpCode } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const CODE = buildTotpCode();
const dto = { twoFactorCode: CODE };

interface Harness {
  readonly deps: ChallengeSubmitHookDeps;
  readonly resolve: jest.Mock;
  readonly completeChallenge: jest.Mock;
  readonly challengeSettled: jest.Mock;
  readonly navigate: jest.Mock;
}

const completed = (
  token: string,
  recoveryCodesRemaining: number | null = null
): ChallengeResult => ({ kind: 'completed', token, recoveryCodesRemaining });

const failed = (reason: ChallengeFailureReason): ChallengeResult => ({ kind: 'failed', reason });

const harness = (
  from: ChallengeSubmitHookDeps['from'] = undefined,
  loadFailure: unknown = undefined
): Harness => {
  const completeChallenge = jest.fn();
  const challengeSettled = jest.fn();
  const navigate = jest.fn();
  const resolve = jest.fn((token: symbol): Promise<unknown> => {
    if (token === AUTH_TOKENS.GraphQLSignInProvider) {
      return loadFailure === undefined
        ? Promise.resolve({ completeChallenge })
        : Promise.reject(loadFailure);
    }
    return Promise.resolve({ challengeSettled });
  });
  const loader = { resolve } as unknown as AuthProviderLoader;
  return {
    deps: { loader, navigate, from },
    resolve,
    completeChallenge,
    challengeSettled,
    navigate,
  };
};

const submit = async (
  deps: ChallengeSubmitHookDeps
): Promise<{ outcome: ChallengeResult | null; unmount: () => void }> => {
  const { result, unmount } = renderHook(() => useChallengeSubmit(deps));
  let outcome: ChallengeResult | null = null;
  await act(async () => {
    outcome = await result.current.submit(dto);
  });
  return { outcome, unmount };
};

describe('useChallengeSubmit', () => {
  const pendingSessionId = buildPendingSessionId();

  beforeEach(() => {
    resetClientStores();
    useAuthStore.setState({ pendingSessionId });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('resolves the provider via the loader and completes once with session and code', async () => {
    const h = harness();
    const token = buildToken();
    h.completeChallenge.mockResolvedValue(completed(token));

    const { outcome } = await submit(h.deps);

    expect(outcome).toEqual(completed(token));
    expect(h.resolve).toHaveBeenCalledWith(AUTH_TOKENS.GraphQLSignInProvider);
    expect(h.completeChallenge).toHaveBeenCalledTimes(1);
    expect(h.completeChallenge).toHaveBeenCalledWith(
      { twoFactorCode: CODE, pendingSessionId },
      expect.any(AbortSignal)
    );
  });

  it('sends nothing for a second submit while one is in flight', async () => {
    const h = harness();
    let release: (result: ChallengeResult) => void = () => undefined;
    h.completeChallenge.mockReturnValue(new Promise<ChallengeResult>((r) => (release = r)));
    const { result } = renderHook(() => useChallengeSubmit(h.deps));

    let first: Promise<ChallengeResult | null> = Promise.resolve(null);
    let second: ChallengeResult | null = failed('server');
    await act(async () => {
      first = result.current.submit(dto);
      second = await result.current.submit(dto);
    });
    await act(async () => {
      release(completed(buildToken()));
      await first;
    });

    expect(second).toBeNull();
    expect(h.completeChallenge).toHaveBeenCalledTimes(1);
  });

  it('answers expired_session without a request when there is no pending session', async () => {
    useAuthStore.setState({ pendingSessionId: null });
    const h = harness();

    const { outcome } = await submit(h.deps);

    expect(outcome).toEqual(failed('expired_session'));
    expect(h.resolve).not.toHaveBeenCalledWith(AUTH_TOKENS.GraphQLSignInProvider);
    expect(h.completeChallenge).not.toHaveBeenCalled();
    expect(h.challengeSettled).toHaveBeenCalledWith(failed('expired_session'));
    expect(h.navigate).toHaveBeenCalledTimes(1);
  });

  it.each([
    [0, 0],
    [1, 1],
    [2, 2],
    [3, null],
    [10, null],
    [null, null],
  ])(
    'writes one patch with the token and keeps %p remaining codes as %p',
    async (remaining, kept) => {
      const h = harness();
      const token = buildToken();
      h.completeChallenge.mockResolvedValue(completed(token, remaining));
      const setState = jest.spyOn(useAuthStore, 'setState');

      await submit(h.deps);

      expect(setState).toHaveBeenCalledTimes(1);
      expect(setState).toHaveBeenCalledWith({
        token,
        twoFactorStatus: 'enabled',
        pendingSessionId: null,
        recoveryCodesRemaining: kept,
      });
      expect(h.navigate).not.toHaveBeenCalled();
    }
  );

  it('leaves exactly the token, status and count in the store on completion', async () => {
    const h = harness();
    const token = buildToken();
    h.completeChallenge.mockResolvedValue(completed(token, 1));

    await submit(h.deps);

    expect(useAuthStore.getState()).toEqual({
      ...CLEARED_AUTH_STATE,
      token,
      twoFactorStatus: 'enabled',
      recoveryCodesRemaining: 1,
    });
  });

  it.each<ChallengeResult>([
    completed(buildToken()),
    failed('invalid_code'),
    failed('expired_session'),
    failed('locked'),
    failed('rate_limited'),
    failed('network'),
    failed('server'),
  ])('records the settled result once for %j', async (result) => {
    const h = harness();
    h.completeChallenge.mockResolvedValue(result);

    await submit(h.deps);

    expect(h.resolve).toHaveBeenCalledWith(AUTH_TOKENS.AuthSecuritySignals);
    expect(h.challengeSettled).toHaveBeenCalledTimes(1);
    expect(h.challengeSettled).toHaveBeenCalledWith(result);
  });

  it('keeps the pending session and writes nothing on invalid_code', async () => {
    const h = harness();
    h.completeChallenge.mockResolvedValue(failed('invalid_code'));
    const setState = jest.spyOn(useAuthStore, 'setState');

    await submit(h.deps);

    expect(setState).not.toHaveBeenCalled();
    expect(useAuthStore.getState().pendingSessionId).toBe(pendingSessionId);
    expect(h.navigate).not.toHaveBeenCalled();
  });

  it.each([
    ['expired_session', 'two_factor_expired'],
    ['locked', 'account_locked'],
  ] as const)('navigates to sign-in with the %s notice %s', async (reason, notice) => {
    const from = { pathname: '/boards', search: '?a=1', hash: '#x' };
    const h = harness(from);
    h.completeChallenge.mockResolvedValue(failed(reason));

    await submit(h.deps);

    expect(h.navigate).toHaveBeenCalledTimes(1);
    expect(h.navigate).toHaveBeenCalledWith(ROUTE_PATHS.signIn, {
      replace: true,
      state: { from, focusMain: true, notice },
    });
  });

  it('still navigates and resolves the result when recording the signal throws', async () => {
    const h = harness();
    h.challengeSettled.mockImplementation(() => {
      throw new Error('telemetry down');
    });
    h.completeChallenge.mockResolvedValue(failed('locked'));

    const { outcome } = await submit(h.deps);

    expect(outcome).toEqual(failed('locked'));
    expect(h.challengeSettled).toHaveBeenCalledTimes(1);
    expect(h.navigate).toHaveBeenCalledTimes(1);
  });

  it('submits with the deps of the latest render', async () => {
    const initial = harness();
    const latest = harness({ pathname: '/deals', search: '', hash: '' });
    latest.completeChallenge.mockResolvedValue(failed('locked'));
    const { result, rerender } = renderHook(({ deps }) => useChallengeSubmit(deps), {
      initialProps: { deps: initial.deps },
    });

    rerender({ deps: latest.deps });
    await act(async () => {
      await result.current.submit(dto);
    });

    expect(initial.resolve).not.toHaveBeenCalled();
    expect(latest.navigate).toHaveBeenCalledWith(ROUTE_PATHS.signIn, {
      replace: true,
      state: { from: latest.deps.from, focusMain: true, notice: 'account_locked' },
    });
  });

  it('leaves the from key out when the challenge arrived without one', async () => {
    const h = harness();
    h.completeChallenge.mockResolvedValue(failed('locked'));

    await submit(h.deps);

    expect(h.navigate).toHaveBeenCalledWith(ROUTE_PATHS.signIn, {
      replace: true,
      state: { focusMain: true, notice: 'account_locked' },
    });
    expect(Object.keys((h.navigate.mock.calls[0]?.[1] as { state: object }).state)).toEqual([
      'focusMain',
      'notice',
    ]);
  });

  it.each(['invalid_code', 'rate_limited', 'network', 'server'] as const)(
    'does not navigate on %s',
    async (reason) => {
      const h = harness();
      h.completeChallenge.mockResolvedValue(failed(reason));

      await submit(h.deps);

      expect(h.navigate).not.toHaveBeenCalled();
    }
  );

  it('turns a rejected provider load into a network failure and still records it', async () => {
    const h = harness(undefined, new Error('chunk'));

    const { outcome } = await submit(h.deps);

    expect(outcome).toEqual(failed('network'));
    expect(h.completeChallenge).not.toHaveBeenCalled();
    expect(h.challengeSettled).toHaveBeenCalledWith(failed('network'));
  });

  it('survives a signals load failure', async () => {
    const h = harness();
    h.completeChallenge.mockResolvedValue(failed('server'));
    h.resolve.mockImplementation((token: symbol) =>
      token === AUTH_TOKENS.GraphQLSignInProvider
        ? Promise.resolve({ completeChallenge: h.completeChallenge })
        : Promise.reject(new Error('chunk'))
    );

    const { outcome } = await submit(h.deps);

    expect(outcome).toEqual(failed('server'));
    expect(h.challengeSettled).not.toHaveBeenCalled();
  });

  it('publishes, records and navigates nothing for a run aborted by unmount', async () => {
    const h = harness();
    let release: (result: ChallengeResult) => void = () => undefined;
    h.completeChallenge.mockReturnValue(new Promise<ChallengeResult>((r) => (release = r)));
    const setState = jest.spyOn(useAuthStore, 'setState');
    const { result, unmount } = renderHook(() => useChallengeSubmit(h.deps));
    let pending: Promise<ChallengeResult | null> = Promise.resolve(null);
    act(() => {
      pending = result.current.submit(dto);
    });
    await act(async () => Promise.resolve());

    unmount();
    release(failed('locked'));
    const outcome = await pending;

    expect(outcome).toBeNull();
    expect(setState).not.toHaveBeenCalled();
    expect(h.challengeSettled).not.toHaveBeenCalled();
    expect(h.navigate).not.toHaveBeenCalled();
  });

  it('does not navigate when the unmount lands while the result is being recorded', async () => {
    const h = harness();
    h.completeChallenge.mockResolvedValue(failed('expired_session'));
    let releaseSignals: (signals: unknown) => void = () => undefined;
    h.resolve.mockImplementation((token: symbol) =>
      token === AUTH_TOKENS.GraphQLSignInProvider
        ? Promise.resolve({ completeChallenge: h.completeChallenge })
        : new Promise((r) => (releaseSignals = r))
    );
    const { result, unmount } = renderHook(() => useChallengeSubmit(h.deps));
    let pending: Promise<ChallengeResult | null> = Promise.resolve(null);
    act(() => {
      pending = result.current.submit(dto);
    });
    await act(async () => Promise.resolve());

    unmount();
    releaseSignals({ challengeSettled: h.challengeSettled });
    const outcome = await pending;

    expect(outcome).toBeNull();
    expect(h.challengeSettled).toHaveBeenCalledWith(failed('expired_session'));
    expect(h.navigate).not.toHaveBeenCalled();
  });

  it('navigates once the result is recorded when the run was not aborted', async () => {
    const h = harness();
    h.completeChallenge.mockResolvedValue(failed('expired_session'));
    let releaseSignals: (signals: unknown) => void = () => undefined;
    h.resolve.mockImplementation((token: symbol) =>
      token === AUTH_TOKENS.GraphQLSignInProvider
        ? Promise.resolve({ completeChallenge: h.completeChallenge })
        : new Promise((r) => (releaseSignals = r))
    );
    const { result } = renderHook(() => useChallengeSubmit(h.deps));
    let pending: Promise<ChallengeResult | null> = Promise.resolve(null);
    act(() => {
      pending = result.current.submit(dto);
    });
    await act(async () => Promise.resolve());

    expect(h.navigate).not.toHaveBeenCalled();
    await act(async () => {
      releaseSignals({ challengeSettled: h.challengeSettled });
      await pending;
    });

    expect(h.navigate).toHaveBeenCalledTimes(1);
    expect(h.navigate).toHaveBeenCalledWith(ROUTE_PATHS.signIn, {
      replace: true,
      state: { focusMain: true, notice: 'two_factor_expired' },
    });
  });

  it('still submits after a StrictMode style remount', async () => {
    const h = harness();
    h.completeChallenge.mockResolvedValue(failed('server'));
    const view = renderHook(() => useChallengeSubmit(h.deps));
    view.unmount();

    const { outcome } = await submit(h.deps);

    expect(outcome).toEqual(failed('server'));
    expect(h.completeChallenge).toHaveBeenCalledTimes(1);
  });
});

const loadSubmit = (): Promise<{
  readonly useSubmit: typeof useChallengeSubmit;
  readonly store: typeof useAuthStore;
  readonly tokens: typeof AUTH_TOKENS;
}> =>
  loadIsolated(async () => {
    jest.doMock('react', () => React);
    return {
      useSubmit: (await import('@auth/hooks/use-challenge-submit')).default,
      store: (await import('@auth/stores/use-auth-store')).default,
      tokens: (await import('@/modules/user/config/tokens')).default,
    };
  });

describe('useChallengeSubmit tables loaded inside the test', () => {
  const loaded = async (
    result: ChallengeResult | 'load-failure',
    pending: string | null = buildPendingSessionId()
  ): Promise<{
    readonly outcome: ChallengeResult | null;
    readonly navigate: jest.Mock;
    readonly store: typeof useAuthStore;
  }> => {
    const { useSubmit, store, tokens } = await loadSubmit();
    store.setState({ ...CLEARED_AUTH_STATE, pendingSessionId: pending });
    const navigate = jest.fn();
    const resolve = jest.fn((token: symbol): Promise<unknown> => {
      if (token !== tokens.GraphQLSignInProvider) {
        return Promise.resolve({ challengeSettled: jest.fn() });
      }
      return result === 'load-failure'
        ? Promise.reject(new Error('chunk'))
        : Promise.resolve({ completeChallenge: jest.fn().mockResolvedValue(result) });
    });
    const deps = {
      loader: { resolve } as unknown as AuthProviderLoader,
      navigate,
      from: undefined,
    };
    const view = renderHook(() => useSubmit(deps));
    let outcome: ChallengeResult | null = null;
    await act(async () => {
      outcome = await view.result.current.submit(dto);
    });
    return { outcome, navigate, store };
  };

  it('answers expired_session and leaves for sign-in when no pending session exists', async () => {
    const { outcome, navigate } = await loaded(failed('server'), null);

    expect(outcome).toStrictEqual({ kind: 'failed', reason: 'expired_session' });
    expect(navigate).toHaveBeenCalledWith(ROUTE_PATHS.signIn, {
      replace: true,
      state: { focusMain: true, notice: 'two_factor_expired' },
    });
  });

  it('answers a network failure, without leaving, when the provider cannot load', async () => {
    const { outcome, navigate } = await loaded('load-failure');

    expect(outcome).toStrictEqual({ kind: 'failed', reason: 'network' });
    expect(navigate).not.toHaveBeenCalled();
  });

  it.each([
    ['invalid_code', null],
    ['expired_session', 'two_factor_expired'],
    ['locked', 'account_locked'],
    ['rate_limited', null],
    ['network', null],
    ['server', null],
  ] as const)(
    'leaves for sign-in with notice %s -> %s only when one is mapped',
    async (reason, notice) => {
      const { navigate } = await loaded(failed(reason));

      const expected =
        notice === null
          ? []
          : [[ROUTE_PATHS.signIn, { replace: true, state: { focusMain: true, notice } }]];
      expect(navigate.mock.calls).toStrictEqual(expected);
    }
  );

  it.each([
    [-1, null],
    [0, 0],
    [1, 1],
    [2, 2],
    [3, null],
    [4, null],
    [null, null],
  ])('keeps %p remaining codes as %p after completing', async (remaining, kept) => {
    const token = buildToken();

    const { store, navigate } = await loaded(completed(token, remaining));

    expect(store.getState()).toStrictEqual({
      ...CLEARED_AUTH_STATE,
      token,
      twoFactorStatus: 'enabled',
      pendingSessionId: null,
      recoveryCodesRemaining: kept,
    });
    expect(navigate).not.toHaveBeenCalled();
  });
});
