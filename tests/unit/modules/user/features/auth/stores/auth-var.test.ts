import { act, renderHook } from '@testing-library/react';

import AuthStateVar from '@auth/stores/auth-var';
import useAuthState from '@auth/stores/use-auth-state';
import { buildEmail } from '@tests/builders';

const ENV_KEY = 'REACT_APP_LHCI_PRELOADED_AUTH_TOKEN';
const CLEARED = {
  email: '',
  token: null,
  user: null,
  loginLoading: false,
  loginError: null,
  registerLoading: false,
  registerError: null,
};

describe('auth-var state helpers', () => {
  beforeEach(() => AuthStateVar.reset());

  it('starts from a fully cleared state', () => {
    expect(AuthStateVar.get()).toEqual(CLEARED);
  });

  it('merges partial updates and resets back to cleared state', () => {
    AuthStateVar.set({ email: 'a@b.c', token: 't', loginLoading: true });
    expect(AuthStateVar.get()).toMatchObject({ email: 'a@b.c', token: 't', loginLoading: true });

    AuthStateVar.reset();
    expect(AuthStateVar.get().token).toBeNull();
  });

  it('re-renders consumers of useAuthState when the reactive var changes', () => {
    const email = buildEmail();
    const { result } = renderHook(() => useAuthState());
    expect(result.current.email).toBe('');

    act(() => AuthStateVar.set({ email }));
    expect(result.current.email).toBe(email);
  });
});

describe('readSeedToken', () => {
  const originalWindow = global.window;
  const originalEnv = process.env;
  const originalWindowToken = window.__PRELOADED_AUTH_TOKEN__;
  const originalEnvToken = process.env[ENV_KEY];

  afterEach(() => {
    Object.defineProperty(global, 'window', { configurable: true, value: originalWindow });
    Object.defineProperty(process, 'env', { configurable: true, value: originalEnv });
    if (originalWindowToken === undefined) delete window.__PRELOADED_AUTH_TOKEN__;
    else window.__PRELOADED_AUTH_TOKEN__ = originalWindowToken;
    if (originalEnvToken === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = originalEnvToken;
  });

  it('prefers the trimmed token injected on window', () => {
    const token = AuthStateVar.readSeedToken(
      { [AuthStateVar.windowKey]: ' window-token ' },
      ' env-token '
    );
    expect(token).toBe('window-token');
  });

  it('falls back to the trimmed env token when window has none', () => {
    expect(AuthStateVar.readSeedToken({}, ' env-token ')).toBe('env-token');
  });

  it('returns null when neither source has a token', () => {
    expect(AuthStateVar.readSeedToken({}, undefined)).toBeNull();
  });

  it('reads the window token by default when window is present', () => {
    window.__PRELOADED_AUTH_TOKEN__ = 'win-default';
    expect(AuthStateVar.readSeedToken(undefined, undefined)).toBe('win-default');
  });

  it('uses the default env token when window is absent', () => {
    Object.defineProperty(global, 'window', { configurable: true, value: undefined });
    process.env[ENV_KEY] = 'env-token';

    expect(AuthStateVar.readSeedToken()).toBe('env-token');
  });

  it('returns null when window is absent and no env token is set', () => {
    Object.defineProperty(global, 'window', { configurable: true, value: undefined });
    delete process.env[ENV_KEY];

    expect(AuthStateVar.readSeedToken()).toBeNull();
  });

  it('returns null when reading the env token throws', () => {
    const throwingEnv = new Proxy(process.env, {
      get(target: NodeJS.ProcessEnv, prop: string | symbol): unknown {
        if (prop === ENV_KEY) throw new Error('no env access');
        return Reflect.get(target, prop);
      },
    });
    Object.defineProperty(process, 'env', { configurable: true, value: throwingEnv });

    expect(AuthStateVar.readSeedToken({})).toBeNull();
  });
});
