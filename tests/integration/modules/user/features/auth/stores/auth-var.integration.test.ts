import '../../../../../setup';

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

describe('auth-var integration coverage', () => {
  beforeEach(() => AuthStateVar.reset());

  it('merges updates, exposes a cleared baseline, and resets', () => {
    AuthStateVar.set({ email: 'a@b.c', token: 't' });
    expect(AuthStateVar.get()).toMatchObject({ email: 'a@b.c', token: 't' });
    AuthStateVar.reset();
    expect(AuthStateVar.get()).toEqual(CLEARED);
  });

  it('re-renders consumers of useAuthState on change', () => {
    const { result } = renderHook(() => useAuthState());
    expect(result.current.token).toBeNull();
    act(() => AuthStateVar.set({ token: 'live' }));
    expect(result.current.token).toBe('live');
  });

  it('prefers a window token over the env token', () => {
    expect(AuthStateVar.readSeedToken({ [AuthStateVar.windowKey]: ' win ' }, ' env ')).toBe('win');
  });

  it('falls back to the env token, then to null', () => {
    expect(AuthStateVar.readSeedToken({}, ' env ')).toBe('env');
    expect(AuthStateVar.readSeedToken({}, undefined)).toBeNull();
  });

  it('reads the window token by default when window is present', () => {
    const original = window.__PRELOADED_AUTH_TOKEN__;
    window.__PRELOADED_AUTH_TOKEN__ = 'win-default';
    try {
      expect(AuthStateVar.readSeedToken(undefined, undefined)).toBe('win-default');
    } finally {
      if (original === undefined) delete window.__PRELOADED_AUTH_TOKEN__;
      else window.__PRELOADED_AUTH_TOKEN__ = original;
    }
  });

  it('uses the env token by default when window is absent, else null', () => {
    const originalWindow = global.window;
    const originalEnv = process.env[ENV_KEY];
    Object.defineProperty(global, 'window', { configurable: true, value: undefined });

    try {
      process.env[ENV_KEY] = 'env-token';
      expect(AuthStateVar.readSeedToken()).toBe('env-token');
      delete process.env[ENV_KEY];
      expect(AuthStateVar.readSeedToken()).toBeNull();
    } finally {
      Object.defineProperty(global, 'window', { configurable: true, value: originalWindow });
      if (originalEnv !== undefined) process.env[ENV_KEY] = originalEnv;
      else delete process.env[ENV_KEY];
    }
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
    try {
      expect(AuthStateVar.readSeedToken({})).toBeNull();
    } finally {
      Object.defineProperty(process, 'env', { configurable: true, value: originalEnv });
    }
  });
});
