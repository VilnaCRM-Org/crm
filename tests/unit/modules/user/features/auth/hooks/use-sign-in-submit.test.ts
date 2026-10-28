import 'reflect-metadata';

import { act, renderHook } from '@testing-library/react';

import sandboxDemoSessionProvider from '@/config/env/sandbox-demo-session-provider';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import useSignInSubmit from '@auth/hooks/use-sign-in-submit';
import type { AuthProviderLoader } from '@auth/stores';
import useAuthStore, { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import type { AuthError } from '@auth/types/auth-error';
import type { SignInResult } from '@auth/types/two-factor/sign-in';
import { buildEmail, buildPassword, buildPendingSessionId, buildToken } from '@tests/builders';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const DEMO = { email: 'demo@vilnacrm.com', password: 'Demo1234' };
const DEMO_TOKEN = 'sandbox-demo-session-token';

const LOAD_FAILURE = {
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
  readonly resolve: jest.Mock;
  readonly login: jest.Mock;
  readonly loginSettled: jest.Mock;
}

const stubs = (result: SignInResult | null = null): Stubs => {
  const login = jest.fn().mockResolvedValue(result);
  const loginSettled = jest.fn();
  const resolve = jest.fn((token: symbol) =>
    Promise.resolve(token === AUTH_TOKENS.GraphQLSignInProvider ? { login } : { loginSettled })
  );
  return { loader: { resolve } as unknown as AuthProviderLoader, resolve, login, loginSettled };
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

describe('useSignInSubmit', () => {
  beforeEach(() => {
    resetClientStores();
    localStorage.removeItem('vilnacrm.sandbox-demo-session');
  });

  afterEach(() => {
    localStorage.removeItem('vilnacrm.sandbox-demo-session');
    jest.restoreAllMocks();
  });

  it('writes the loading state synchronously, before the provider resolves', async () => {
    const s = stubs({ ok: false, error: invalid });
    let release: () => void = () => undefined;
    s.resolve.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = (): void => resolve({ login: s.login });
        })
    );
    useAuthStore.setState({ loginError: invalid });
    const { result } = renderHook(() => useSignInSubmit(s.loader));

    let pending!: Promise<void>;
    act(() => {
      pending = result.current(dto(), new AbortController().signal);
    });

    expect(useAuthStore.getState()).toMatchObject({ loginLoading: true, loginError: null });
    await act(async () => {
      release();
      await pending;
    });
  });

  it('resolves the sign-in provider once and calls login with the dto and signal', async () => {
    const s = stubs({ ok: false, error: invalid });
    const credentials = dto();
    const { signal } = new AbortController();

    await runWith(s, credentials, signal);

    expect(s.resolve).toHaveBeenNthCalledWith(1, AUTH_TOKENS.GraphQLSignInProvider);
    expect(s.login).toHaveBeenCalledTimes(1);
    expect(s.login).toHaveBeenCalledWith(credentials, signal);
  });

  it('keeps one stable run across renders', () => {
    const s = stubs();
    const { result, rerender } = renderHook(() => useSignInSubmit(s.loader));
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  it('writes one session patch: token, status disabled, no pending session', async () => {
    const email = buildEmail();
    const token = buildToken();
    const s = stubs({ ok: true, value: { kind: 'session', email, token } });
    const setState = jest.spyOn(useAuthStore, 'setState');

    await runWith(s);

    expect(useAuthStore.getState()).toEqual({
      ...CLEARED_AUTH_STATE,
      email,
      token,
      twoFactorStatus: 'disabled',
    });
    expect(setState).toHaveBeenLastCalledWith({
      loginLoading: false,
      loginError: null,
      email,
      token,
      twoFactorStatus: 'disabled',
    });
  });

  it('writes a challenge patch with the pending session and never a token', async () => {
    const email = buildEmail();
    const pendingSessionId = buildPendingSessionId();
    const s = stubs({ ok: true, value: { kind: 'challenge', email, pendingSessionId } });

    await runWith(s);

    const state = useAuthStore.getState();
    expect(state).toEqual({ ...CLEARED_AUTH_STATE, email, pendingSessionId });
    expect(state.token).toBeNull();
    expect(state.twoFactorStatus).toBe('unknown');
  });

  it('writes the failure as loginError and stops loading', async () => {
    const s = stubs({ ok: false, error: invalid });

    await runWith(s);

    expect(useAuthStore.getState()).toMatchObject({ loginLoading: false, loginError: invalid });
  });

  it('writes loading false only, and records nothing, for an aborted result', async () => {
    const aborted: AuthError = {
      kind: 'network',
      displayMessage: '',
      retryable: false,
      aborted: true,
    };
    const s = stubs({ ok: false, error: aborted });
    useAuthStore.setState({ email: 'kept@example.com' });

    await runWith(s);

    expect(useAuthStore.getState()).toMatchObject({
      loginLoading: false,
      loginError: null,
      email: 'kept@example.com',
    });
    expect(s.resolve).toHaveBeenCalledTimes(1);
    expect(s.loginSettled).not.toHaveBeenCalled();
  });

  it('hands the settled result to the security signals once, unless aborted', async () => {
    const result: SignInResult = { ok: false, error: invalid };
    const s = stubs(result);

    await runWith(s);

    expect(s.resolve).toHaveBeenNthCalledWith(2, AUTH_TOKENS.AuthSecuritySignals);
    expect(s.loginSettled).toHaveBeenCalledTimes(1);
    expect(s.loginSettled).toHaveBeenCalledWith(result);
  });

  it('writes the result but skips the signals when the signal aborted meanwhile', async () => {
    const s = stubs({ ok: false, error: invalid });
    const controller = new AbortController();
    s.login.mockImplementation(async () => {
      controller.abort();
      return { ok: false, error: invalid };
    });

    await runWith(s, dto(), controller.signal);

    expect(useAuthStore.getState().loginError).toEqual(invalid);
    expect(s.loginSettled).not.toHaveBeenCalled();
  });

  it('survives a failing signals step without disturbing the written state', async () => {
    const s = stubs({ ok: false, error: invalid });
    s.resolve.mockImplementation((token: symbol) =>
      token === AUTH_TOKENS.GraphQLSignInProvider
        ? Promise.resolve({ login: s.login })
        : Promise.reject(new Error('no signals'))
    );

    await expect(runWith(s)).resolves.toBeUndefined();

    expect(useAuthStore.getState().loginError).toEqual(invalid);
  });

  it('writes the load-failure error when the provider cannot be resolved', async () => {
    const s = stubs();
    s.resolve.mockRejectedValue(new Error('chunk'));

    await runWith(s);

    expect(useAuthStore.getState()).toMatchObject({
      loginLoading: false,
      loginError: LOAD_FAILURE,
    });
    expect(s.login).not.toHaveBeenCalled();
  });

  it('writes no load-failure error when the signal is already aborted', async () => {
    const s = stubs();
    s.resolve.mockRejectedValue(new Error('chunk'));
    const controller = new AbortController();
    controller.abort();

    await runWith(s, dto(), controller.signal);

    expect(useAuthStore.getState()).toMatchObject({ loginLoading: false, loginError: null });
  });

  describe('sandbox demo credentials', () => {
    it('signs in without resolving the provider or sending a request', async () => {
      const s = stubs();

      await runWith(s, DEMO);

      expect(s.resolve).toHaveBeenCalledTimes(1);
      expect(s.resolve).toHaveBeenCalledWith(AUTH_TOKENS.AuthSecuritySignals);
      expect(s.resolve).not.toHaveBeenCalledWith(AUTH_TOKENS.GraphQLSignInProvider);
      expect(s.login).not.toHaveBeenCalled();
      expect(useAuthStore.getState()).toEqual({
        ...CLEARED_AUTH_STATE,
        email: DEMO.email,
        token: DEMO_TOKEN,
        twoFactorStatus: 'disabled',
      });
      sandboxDemoSessionProvider.signOut();
    });

    it('records the demo session as a settled successful sign-in', async () => {
      const s = stubs();

      await runWith(s, DEMO);

      expect(s.loginSettled).toHaveBeenCalledTimes(1);
      expect(s.loginSettled).toHaveBeenCalledWith({
        ok: true,
        value: { kind: 'session', email: DEMO.email, token: DEMO_TOKEN },
      });
      sandboxDemoSessionProvider.signOut();
    });

    it('keeps the demo session when the signals fail to load', async () => {
      const s = stubs();
      s.resolve.mockRejectedValue(new Error('chunk'));

      await runWith(s, DEMO);

      expect(s.loginSettled).not.toHaveBeenCalled();
      expect(useAuthStore.getState()).toMatchObject({ loginLoading: false, token: DEMO_TOKEN });
      sandboxDemoSessionProvider.signOut();
    });

    it('does not use the demo session for an aborted signal', async () => {
      const s = stubs({ ok: false, error: invalid });
      const controller = new AbortController();
      controller.abort();

      await runWith(s, DEMO, controller.signal);

      expect(s.login).toHaveBeenCalledTimes(1);
      expect(useAuthStore.getState().token).toBeNull();
    });

    it('sends other credentials to the provider', async () => {
      const s = stubs({ ok: false, error: invalid });

      await runWith(s, { email: DEMO.email, password: 'Wrong123' });

      expect(s.login).toHaveBeenCalledTimes(1);
    });
  });
});
