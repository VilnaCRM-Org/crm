import { act, renderHook } from '@testing-library/react';

import sandboxDemoSessionProvider from '@/config/env/sandbox-demo-session-provider';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import useSignInSubmit, { signInSubmitHandlerLoader } from '@auth/hooks/use-sign-in-submit';
import type { AuthProviderLoader } from '@auth/stores';
import useAuthStore from '@auth/stores/use-auth-store';
import type { AuthError } from '@auth/types/auth-error';
import signInSubmitHandler from '@auth/utils/sign-in-submit-handler';
import { buildEmail, buildPassword } from '@tests/builders';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const LOAD_FAILURE: AuthError = {
  kind: 'network',
  displayMessage: 'Failed to load the authentication service. Please try again.',
  retryable: true,
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

const failHandlerChunk = (): void => {
  jest.spyOn(signInSubmitHandlerLoader, 'load').mockRejectedValueOnce(new Error('chunk'));
};

const failProvider = (): void => {
  jest.spyOn(signInSubmitHandler, 'run').mockResolvedValueOnce(false);
};

describe('useSignInSubmit', () => {
  beforeEach(() => resetClientStores());

  afterEach(() => jest.restoreAllMocks());

  it('writes the loading state synchronously, before the handler chunk loads', async () => {
    const s = stubs();
    useAuthStore.setState({ loginError: invalid });
    const { result } = renderHook(() => useSignInSubmit(s.loader));

    let pending!: Promise<void>;
    act(() => {
      pending = result.current(dto(), new AbortController().signal);
    });

    expect(useAuthStore.getState()).toMatchObject({ loginLoading: true, loginError: null });
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

  it('hands the loader, store, demo session, dto and signal to the handler', async () => {
    const s = stubs();
    const run = jest.spyOn(signInSubmitHandler, 'run');
    const credentials = dto();
    const { signal } = new AbortController();

    await runWith(s, credentials, signal);

    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(
      { loader: s.loader, store: useAuthStore, demoSession: sandboxDemoSessionProvider },
      credentials,
      signal
    );
    expect(s.login).toHaveBeenCalledWith(credentials, signal);
  });

  it('leaves the state the handler wrote once it handled the sign-in', async () => {
    await runWith(stubs());

    expect(useAuthStore.getState()).toMatchObject({ loginLoading: false, loginError: invalid });
  });

  it.each([
    ['the handler chunk fails to load', failHandlerChunk],
    ['the handler cannot resolve the provider', failProvider],
  ])('writes the load-failure error when %s', async (_name, arrange) => {
    const s = stubs();
    arrange();

    await runWith(s);

    expect(useAuthStore.getState().loginLoading).toBe(false);
    expect(useAuthStore.getState().loginError).toEqual(LOAD_FAILURE);
    expect(s.login).not.toHaveBeenCalled();
  });

  it.each([
    ['the handler chunk fails to load', failHandlerChunk],
    ['the handler cannot resolve the provider', failProvider],
  ])('writes no load-failure error for an aborted signal when %s', async (_name, arrange) => {
    arrange();

    await runWith(stubs(), dto(), abortedSignal());

    expect(useAuthStore.getState()).toMatchObject({ loginLoading: false, loginError: null });
  });

  it('does not run a handler that failed to load', async () => {
    failHandlerChunk();
    const run = jest.spyOn(signInSubmitHandler, 'run');

    await runWith(stubs());

    expect(run).not.toHaveBeenCalled();
  });
});
