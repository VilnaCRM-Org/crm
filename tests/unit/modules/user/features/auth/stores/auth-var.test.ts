import { act, renderHook } from '@testing-library/react';

import AuthStateVar, { useAuthState } from '@auth/stores/auth-var';

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
    const { result } = renderHook(() => useAuthState());
    expect(result.current.email).toBe('');

    act(() => AuthStateVar.set({ email: 'live@update.com' }));
    expect(result.current.email).toBe('live@update.com');
  });
});

describe('readSeedToken', () => {
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
    const original = window.__PRELOADED_AUTH_TOKEN__;
    window.__PRELOADED_AUTH_TOKEN__ = 'win-default';
    expect(AuthStateVar.readSeedToken(undefined, undefined)).toBe('win-default');
    if (original === undefined) delete window.__PRELOADED_AUTH_TOKEN__;
    else window.__PRELOADED_AUTH_TOKEN__ = original;
  });

  it('uses the default env token when window is absent', () => {
    const originalWindow = global.window;
    const originalEnv = process.env[ENV_KEY];
    Object.defineProperty(global, 'window', { configurable: true, value: undefined });
    process.env[ENV_KEY] = 'env-token';

    expect(AuthStateVar.readSeedToken()).toBe('env-token');

    Object.defineProperty(global, 'window', { configurable: true, value: originalWindow });
    if (originalEnv === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = originalEnv;
  });

  it('returns null when window is absent and no env token is set', () => {
    const originalWindow = global.window;
    const originalEnv = process.env[ENV_KEY];
    Object.defineProperty(global, 'window', { configurable: true, value: undefined });
    delete process.env[ENV_KEY];

    expect(AuthStateVar.readSeedToken()).toBeNull();

    Object.defineProperty(global, 'window', { configurable: true, value: originalWindow });
    if (originalEnv !== undefined) process.env[ENV_KEY] = originalEnv;
  });

  it('returns null when reading the env token throws', () => {
    const originalEnv = process.env;
    const throwingEnv = new Proxy(process.env, {
      get(target: NodeJS.ProcessEnv, prop: string | symbol): unknown {
        if (prop === ENV_KEY) throw new Error('no env access');
        return Reflect.get(target, prop);
      },
    });
    Object.defineProperty(process, 'env', { configurable: true, value: throwingEnv });

    expect(AuthStateVar.readSeedToken({})).toBeNull();

    Object.defineProperty(process, 'env', { configurable: true, value: originalEnv });
  });

  it('keeps the module-level reactive var in sync with updates', () => {
    AuthStateVar.set({ token: 'direct' });
    expect(AuthStateVar.get().token).toBe('direct');
    AuthStateVar.reset();
  });
});
