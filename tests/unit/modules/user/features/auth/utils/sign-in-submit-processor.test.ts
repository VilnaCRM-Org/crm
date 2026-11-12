import sandboxDemoSessionProvider from '@/config/env/sandbox-demo-session-provider';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import observabilityCore from '@/services/observability/observability-core';
import type { AuthProviderLoader } from '@auth/stores';
import authSessionProvider from '@auth/stores/auth-session-provider';
import useAuthStore, { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import type { AuthError } from '@auth/types/auth-error';
import type { SignInSubmitContext } from '@auth/types/sign-in/sign-in-submit-context';
import type { SignInResult } from '@auth/types/two-factor/sign-in';
import signInSubmitProcessor from '@auth/utils/sign-in-submit-processor';
import {
  buildEmail,
  buildPassword,
  buildPendingSessionId,
  buildRecoveryCodeSet,
  buildToken,
} from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const DEMO = { email: 'demo@vilnacrm.com', password: 'Demo1234' };
const DEMO_TOKEN = 'sandbox-demo-session-token';

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

const contextOf = (s: Stubs): SignInSubmitContext => ({
  loader: s.loader,
  store: useAuthStore,
  demoSession: sandboxDemoSessionProvider,
  session: authSessionProvider,
  signedOut: CLEARED_AUTH_STATE,
});

const runWith = (
  s: Stubs,
  credentials = dto(),
  signal = new AbortController().signal
): Promise<boolean> => signInSubmitProcessor.run(contextOf(s), credentials, signal);

describe('SignInSubmitProcessor', () => {
  beforeEach(() => {
    resetClientStores();
    localStorage.removeItem('vilnacrm.sandbox-demo-session');
    useAuthStore.setState({ loginLoading: true });
  });

  afterEach(() => {
    localStorage.removeItem('vilnacrm.sandbox-demo-session');
    jest.restoreAllMocks();
  });

  it('resolves the sign-in provider once and calls login with the dto and signal', async () => {
    const s = stubs({ ok: false, error: invalid });
    const credentials = dto();
    const { signal } = new AbortController();

    await expect(runWith(s, credentials, signal)).resolves.toBe(true);

    expect(s.resolve).toHaveBeenNthCalledWith(1, AUTH_TOKENS.GraphQLSignInProvider);
    expect(s.login).toHaveBeenCalledTimes(1);
    expect(s.login).toHaveBeenCalledWith(credentials, signal);
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
      pendingSessionId: null,
      twoFactorStatus: 'disabled',
    });
  });

  it('drops a pending session left by an earlier challenge when a session is issued', async () => {
    const email = buildEmail();
    const token = buildToken();
    useAuthStore.setState({ pendingSessionId: buildPendingSessionId() });
    const s = stubs({ ok: true, value: { kind: 'session', email, token } });

    await runWith(s);

    expect(useAuthStore.getState()).toEqual({
      ...CLEARED_AUTH_STATE,
      email,
      token,
      twoFactorStatus: 'disabled',
    });
    expect(useAuthStore.getState().pendingSessionId).toBeNull();
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

  it('ends an earlier session completely when a challenge follows a held token', async () => {
    const email = buildEmail();
    const pendingSessionId = buildPendingSessionId();
    useAuthStore.setState({
      token: buildToken(),
      twoFactorStatus: 'enabled',
      recoveryCodesRemaining: buildRecoveryCodeSet().items.length,
    });
    const s = stubs({ ok: true, value: { kind: 'challenge', email, pendingSessionId } });
    const clearUser = jest.spyOn(observabilityCore, 'clearUser');
    const demoSignOut = jest.spyOn(sandboxDemoSessionProvider, 'signOut');
    const setState = jest.spyOn(useAuthStore, 'setState');

    await runWith(s);

    expect(useAuthStore.getState()).toEqual({ ...CLEARED_AUTH_STATE, email, pendingSessionId });
    expect(useAuthStore.getState().twoFactorStatus).toBe('unknown');
    expect(useAuthStore.getState().recoveryCodesRemaining).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
    expect(clearUser).toHaveBeenCalledTimes(1);
    expect(demoSignOut).toHaveBeenCalledTimes(1);
    expect(setState).toHaveBeenLastCalledWith({ ...CLEARED_AUTH_STATE, email, pendingSessionId });
  });

  it('ends a held sandbox demo session when a challenge is issued', async () => {
    const s = stubs({
      ok: true,
      value: { kind: 'challenge', email: buildEmail(), pendingSessionId: buildPendingSessionId() },
    });
    await runWith(stubs(), DEMO);
    expect(sandboxDemoSessionProvider.restore()).not.toBeNull();

    await runWith(s);

    expect(sandboxDemoSessionProvider.restore()).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('clears a stale status from the patch without a logout when no token is held', async () => {
    const email = buildEmail();
    const pendingSessionId = buildPendingSessionId();
    useAuthStore.setState({
      twoFactorStatus: 'enabled',
      recoveryCodesRemaining: buildRecoveryCodeSet().items.length,
    });
    const s = stubs({ ok: true, value: { kind: 'challenge', email, pendingSessionId } });
    const clearUser = jest.spyOn(observabilityCore, 'clearUser');
    const demoSignOut = jest.spyOn(sandboxDemoSessionProvider, 'signOut');
    const setState = jest.spyOn(useAuthStore, 'setState');

    await runWith(s);

    expect(useAuthStore.getState()).toEqual({ ...CLEARED_AUTH_STATE, email, pendingSessionId });
    expect(clearUser).not.toHaveBeenCalled();
    expect(demoSignOut).not.toHaveBeenCalled();
    expect(setState).toHaveBeenCalledTimes(1);
    expect(setState).toHaveBeenCalledWith({ ...CLEARED_AUTH_STATE, email, pendingSessionId });
  });

  it('keeps a held session and logs nobody out for a failed sign-in', async () => {
    const token = buildToken();
    useAuthStore.setState({ token, twoFactorStatus: 'enabled' });
    const clearUser = jest.spyOn(observabilityCore, 'clearUser');

    await runWith(stubs({ ok: false, error: invalid }));

    expect(useAuthStore.getState()).toMatchObject({ token, twoFactorStatus: 'enabled' });
    expect(clearUser).not.toHaveBeenCalled();
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
    const kept = buildEmail();
    useAuthStore.setState({ email: kept });

    await runWith(s);

    expect(useAuthStore.getState()).toMatchObject({
      loginLoading: false,
      loginError: null,
      email: kept,
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

  it('writes loading false only and skips the signals for a failure after the abort', async () => {
    const s = stubs({ ok: false, error: invalid });
    const controller = new AbortController();
    s.login.mockImplementation(async () => {
      controller.abort();
      return { ok: false, error: invalid };
    });
    const setState = jest.spyOn(useAuthStore, 'setState');

    await expect(runWith(s, dto(), controller.signal)).resolves.toBe(true);

    expect(setState).toHaveBeenCalledTimes(1);
    expect(setState).toHaveBeenCalledWith({ loginLoading: false });
    expect(useAuthStore.getState()).toMatchObject({ loginLoading: false, loginError: null });
    expect(s.loginSettled).not.toHaveBeenCalled();
  });

  it('does not apply a session that resolves after the abort', async () => {
    const email = buildEmail();
    const token = buildToken();
    const s = stubs();
    const controller = new AbortController();
    s.login.mockImplementation(async () => {
      controller.abort();
      return { ok: true, value: { kind: 'session', email, token } };
    });

    await expect(runWith(s, dto(), controller.signal)).resolves.toBe(true);

    expect(useAuthStore.getState()).toEqual(CLEARED_AUTH_STATE);
    expect(useAuthStore.getState().token).toBeNull();
    expect(s.resolve).toHaveBeenCalledTimes(1);
    expect(s.loginSettled).not.toHaveBeenCalled();
  });

  it('does not apply a challenge that resolves after the abort', async () => {
    const email = buildEmail();
    const pendingSessionId = buildPendingSessionId();
    const s = stubs();
    const clearUser = jest.spyOn(observabilityCore, 'clearUser');
    const controller = new AbortController();
    s.login.mockImplementation(async () => {
      controller.abort();
      return { ok: true, value: { kind: 'challenge', email, pendingSessionId } };
    });

    await runWith(s, dto(), controller.signal);

    expect(useAuthStore.getState()).toEqual(CLEARED_AUTH_STATE);
    expect(clearUser).not.toHaveBeenCalled();
  });

  it('keeps a held session when a challenge resolves after the abort', async () => {
    const token = buildToken();
    useAuthStore.setState({ token });
    const s = stubs();
    const controller = new AbortController();
    const clearUser = jest.spyOn(observabilityCore, 'clearUser');
    s.login.mockImplementation(async () => {
      controller.abort();
      return {
        ok: true,
        value: {
          kind: 'challenge',
          email: buildEmail(),
          pendingSessionId: buildPendingSessionId(),
        },
      };
    });

    await runWith(s, dto(), controller.signal);

    expect(useAuthStore.getState()).toMatchObject({ token, pendingSessionId: null });
    expect(clearUser).not.toHaveBeenCalled();
  });

  it('survives a failing signals step without disturbing the written state', async () => {
    const s = stubs({ ok: false, error: invalid });
    s.resolve.mockImplementation((token: symbol) =>
      token === AUTH_TOKENS.GraphQLSignInProvider
        ? Promise.resolve({ login: s.login })
        : Promise.reject(new Error('no signals'))
    );

    await expect(runWith(s)).resolves.toBe(true);

    expect(useAuthStore.getState().loginError).toEqual(invalid);
  });

  it('reports an unresolved provider without writing state or sending a request', async () => {
    const s = stubs();
    s.resolve.mockRejectedValue(new Error('chunk'));
    const setState = jest.spyOn(useAuthStore, 'setState');

    await expect(runWith(s)).resolves.toBe(false);

    expect(s.resolve).toHaveBeenCalledTimes(1);
    expect(s.login).not.toHaveBeenCalled();
    expect(setState).not.toHaveBeenCalled();
  });

  describe('sandbox demo credentials', () => {
    it('signs in without resolving the provider or sending a request', async () => {
      const s = stubs();

      await expect(runWith(s, DEMO)).resolves.toBe(true);

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

      await expect(runWith(s, DEMO)).resolves.toBe(true);

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

describe('SignInSubmitProcessor settled patch loaded inside the test', () => {
  const runLoaded = async (
    result: SignInResult,
    aborting = false
  ): Promise<{ readonly patches: unknown[][]; readonly handled: boolean }> => {
    const { processor, tokens } = await loadIsolated(async () => ({
      processor: (await import('@auth/utils/sign-in-submit-processor')).default,
      tokens: (await import('@/modules/user/config/tokens')).default,
    }));
    const controller = new AbortController();
    const login = jest.fn(async () => {
      if (aborting) controller.abort();
      return result;
    });
    const resolve = jest.fn((token: symbol) =>
      Promise.resolve(
        token === tokens.GraphQLSignInProvider ? { login } : { loginSettled: jest.fn() }
      )
    );
    const setState = jest.fn();
    const handled = await processor.run(
      {
        loader: { resolve } as unknown as AuthProviderLoader,
        store: { setState },
        demoSession: sandboxDemoSessionProvider,
        session: { token: () => null, signOut: jest.fn() },
        signedOut: CLEARED_AUTH_STATE,
      },
      dto(),
      controller.signal
    );
    return { patches: setState.mock.calls, handled };
  };

  it('writes the session patch with loading cleared', async () => {
    const email = buildEmail();
    const token = buildToken();

    const { patches, handled } = await runLoaded({
      ok: true,
      value: { kind: 'session', email, token },
    });

    expect(handled).toBe(true);
    expect(patches).toStrictEqual([
      [
        {
          loginLoading: false,
          loginError: null,
          email,
          token,
          pendingSessionId: null,
          twoFactorStatus: 'disabled',
        },
      ],
    ]);
  });

  it('writes the failure with loading cleared', async () => {
    const { patches } = await runLoaded({ ok: false, error: invalid });

    expect(patches).toStrictEqual([[{ loginLoading: false, loginError: invalid }]]);
  });

  it('writes only the cleared loading flag for an aborted failure', async () => {
    const aborted: AuthError = {
      kind: 'network',
      displayMessage: '',
      retryable: false,
      aborted: true,
    };

    const { patches } = await runLoaded({ ok: false, error: aborted });

    expect(patches).toStrictEqual([[{ loginLoading: false }]]);
  });

  it('writes only the cleared loading flag when the signal aborts during the request', async () => {
    const { patches } = await runLoaded({ ok: false, error: invalid }, true);

    expect(patches).toStrictEqual([[{ loginLoading: false }]]);
  });

  it('writes the signed-out state with the pending session for a challenge', async () => {
    const email = buildEmail();
    const pendingSessionId = buildPendingSessionId();

    const { patches } = await runLoaded({
      ok: true,
      value: { kind: 'challenge', email, pendingSessionId },
    });

    expect(patches).toStrictEqual([[{ ...CLEARED_AUTH_STATE, email, pendingSessionId }]]);
  });
});
