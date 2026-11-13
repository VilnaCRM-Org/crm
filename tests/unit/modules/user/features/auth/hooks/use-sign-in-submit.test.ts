import { act, renderHook } from '@testing-library/react';
import * as React from 'react';

import sandboxDemoSessionProvider from '@/config/env/sandbox-demo-session-provider';
import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import observabilityCore from '@/services/observability/observability-core';
import useSignInSubmit from '@auth/hooks/use-sign-in-submit';
import type { AuthProviderLoader } from '@auth/stores';
import authSessionProvider from '@auth/stores/auth-session-provider';
import useAuthStore, { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import type { AuthError } from '@auth/types/auth-error';
import signInSubmitProcessor from '@auth/utils/sign-in-submit-processor';
import { buildEmail, buildPassword } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const LOAD_FAILURE: AuthError = {
  kind: 'network',
  displayMessage: 'sign_in.errors.transient',
  retryable: true,
  reason: 'transient',
};

const invalid: AuthError = {
  kind: 'authentication',
  displayMessage: 'sign_in.errors.invalid_credentials',
  retryable: false,
  reason: 'invalid_credentials',
};

interface Stubs {
  readonly loader: AuthProviderLoader;
  readonly login: jest.Mock;
}

const stubs = (): Stubs => {
  const login = jest.fn().mockResolvedValue({ ok: false, error: invalid });
  const loginSettled = jest.fn();
  const resolve = jest.fn((token: symbol) =>
    Promise.resolve(token === AUTH_TOKENS.GraphQLSignInProvider ? { login } : { loginSettled })
  );
  return { loader: { resolve } as unknown as AuthProviderLoader, login };
};

const dto = (): { email: string; password: string } => ({
  email: buildEmail(),
  password: buildPassword(),
});

const runWith = async (
  s: Stubs,
  credentials = dto(),
  signal = new AbortController().signal
): Promise<void> => {
  const { result } = renderHook(() => useSignInSubmit(s.loader));
  await act(async () => {
    await result.current(credentials, signal);
  });
};

const abortedSignal = (): AbortSignal => {
  const controller = new AbortController();
  controller.abort();
  return controller.signal;
};

const failProcessorChunk = (): void => {
  jest.spyOn(ChunkRetryLoader.prototype, 'load').mockRejectedValueOnce(new Error('chunk'));
};

const failProvider = (): void => {
  jest.spyOn(signInSubmitProcessor, 'run').mockResolvedValueOnce(false);
};

describe('useSignInSubmit', () => {
  beforeEach(() => resetClientStores());

  afterEach(() => jest.restoreAllMocks());

  it('writes the loading state synchronously and keeps the error the retry answers', async () => {
    const s = stubs();
    useAuthStore.setState({ loginError: LOAD_FAILURE });
    const setState = jest.spyOn(useAuthStore, 'setState');
    const { result } = renderHook(() => useSignInSubmit(s.loader));

    let pending!: Promise<void>;
    act(() => {
      pending = result.current(dto(), new AbortController().signal);
    });

    expect(setState).toHaveBeenCalledWith({ loginLoading: true });
    expect(useAuthStore.getState()).toMatchObject({ loginLoading: true, loginError: LOAD_FAILURE });
    await act(async () => {
      await pending;
    });
  });

  it('keeps one stable run across renders', () => {
    const { result, rerender } = renderHook(() => useSignInSubmit(stubs().loader));
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  it('hands the loader, store, both sessions, dto and signal to the processor', async () => {
    const s = stubs();
    const run = jest.spyOn(signInSubmitProcessor, 'run');
    const credentials = dto();
    const { signal } = new AbortController();

    await runWith(s, credentials, signal);

    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(
      {
        loader: s.loader,
        store: useAuthStore,
        demoSession: sandboxDemoSessionProvider,
        session: authSessionProvider,
        signedOut: CLEARED_AUTH_STATE,
      },
      credentials,
      signal
    );
    expect(s.login).toHaveBeenCalledWith(credentials, signal);
  });

  it('leaves the state the processor wrote once it processed the sign-in', async () => {
    await runWith(stubs());

    expect(useAuthStore.getState()).toMatchObject({ loginLoading: false, loginError: invalid });
  });

  it.each([
    ['the processor chunk fails to load', failProcessorChunk],
    ['the processor cannot resolve the provider', failProvider],
  ])('writes the load-failure error when %s', async (_name, arrange) => {
    const s = stubs();
    arrange();

    await runWith(s);

    expect(useAuthStore.getState().loginLoading).toBe(false);
    expect(useAuthStore.getState().loginError).toEqual(LOAD_FAILURE);
    expect(s.login).not.toHaveBeenCalled();
  });

  it.each([
    ['the processor chunk fails to load', failProcessorChunk],
    ['the processor cannot resolve the provider', failProvider],
  ])('writes no load-failure error for an aborted signal when %s', async (_name, arrange) => {
    arrange();

    await runWith(stubs(), dto(), abortedSignal());

    expect(useAuthStore.getState()).toMatchObject({ loginLoading: false, loginError: null });
  });

  it('does not run a processor that failed to load', async () => {
    failProcessorChunk();
    const run = jest.spyOn(signInSubmitProcessor, 'run');

    await runWith(stubs());

    expect(run).not.toHaveBeenCalled();
  });

  it('reports a processor chunk that failed to load to observability', async () => {
    const failure = new Error('chunk');
    jest.spyOn(ChunkRetryLoader.prototype, 'load').mockRejectedValueOnce(failure);
    const captureError = jest.spyOn(observabilityCore, 'captureError').mockReturnValue(undefined);

    await runWith(stubs());

    expect(captureError).toHaveBeenCalledTimes(1);
    expect(captureError).toHaveBeenCalledWith(failure, { source: 'auth:sign-in-load' });
  });
});

describe('useSignInSubmit constants loaded inside the test', () => {
  const loadHook = (): Promise<{
    readonly useSubmit: typeof useSignInSubmit;
    readonly store: typeof useAuthStore;
  }> =>
    loadIsolated(async () => {
      jest.doMock('react', () => React);
      return {
        useSubmit: (await import('@auth/hooks/use-sign-in-submit')).default,
        store: (await import('@auth/stores/use-auth-store')).default,
      };
    });

  const rejectingLoader = (): AuthProviderLoader =>
    ({
      resolve: jest.fn(() => Promise.reject(new Error('chunk'))),
    }) as unknown as AuthProviderLoader;

  it('starts every run by raising loginLoading and nothing else', async () => {
    const { useSubmit, store } = await loadHook();
    store.setState({ loginError: LOAD_FAILURE });
    const setState = jest.spyOn(store, 'setState');
    const never = new Promise<never>(() => undefined);
    const loader = { resolve: jest.fn(() => never) } as unknown as AuthProviderLoader;
    const { result } = renderHook(() => useSubmit(loader));

    act(() => {
      void result.current(dto(), new AbortController().signal);
    });

    expect(setState).toHaveBeenCalledTimes(1);
    expect(setState).toHaveBeenCalledWith({ loginLoading: true });
    expect(store.getState().loginError).toBe(LOAD_FAILURE);
  });

  it('writes the network failure and clears loading when the provider cannot load', async () => {
    const { useSubmit, store } = await loadHook();
    const { result } = renderHook(() => useSubmit(rejectingLoader()));

    await act(async () => {
      await result.current(dto(), new AbortController().signal);
    });

    expect(store.getState().loginLoading).toBe(false);
    expect(store.getState().loginError).toStrictEqual({
      kind: 'network',
      displayMessage: 'sign_in.errors.transient',
      retryable: true,
      reason: 'transient',
    });
  });

  it('writes no load failure when the same run was aborted', async () => {
    const { useSubmit, store } = await loadHook();
    const { result } = renderHook(() => useSubmit(rejectingLoader()));

    await act(async () => {
      await result.current(dto(), abortedSignal());
    });

    expect(store.getState()).toMatchObject({ loginLoading: false, loginError: null });
  });
});
