import { DevToolsOptionsFactory } from '@/stores/dev-tools-options';
import { DevToolsRedactor } from '@/stores/dev-tools-redaction';

describe('DevToolsOptionsFactory', () => {
  const options = new DevToolsOptionsFactory(new DevToolsRedactor()).create();

  it('redacts sensitive payload and meta fields', () => {
    const action = {
      type: 'auth/loginUser/rejected',
      payload: { token: 'secret-token' },
      meta: {
        arg: { password: 'hidden-password' },
        request: { clientSecret: 'super-secret' },
      },
    };

    expect(options.actionSanitizer?.(action, 0)).toEqual({
      type: 'auth/loginUser/rejected',
      payload: { token: '***' },
      meta: {
        arg: { password: '***' },
        request: { clientSecret: '***' },
      },
    });
  });

  it('redacts auth state without mutating non-auth branches', () => {
    const state = {
      auth: {
        token: 'secret-token',
        nested: { password: 'hidden-password' },
      },
      registration: {
        error: null,
      },
    };

    expect(options.stateSanitizer?.(state, 0)).toEqual({
      auth: {
        token: '***',
        nested: { password: '***' },
      },
      registration: {
        error: null,
      },
    });
  });

  it('preserves null auth state instead of coercing it to undefined', () => {
    const state = {
      auth: null,
      registration: {
        error: null,
      },
    };

    expect(options.stateSanitizer?.(state, 0)).toEqual(state);
  });

  it('returns the original action when nothing needs sanitizing', () => {
    const action = {
      type: 'noop',
      payload: 'plain-text',
      meta: undefined,
    };

    expect(options.actionSanitizer?.(action, 0)).toBe(action);
  });

  it('returns primitive state values unchanged', () => {
    expect(options.stateSanitizer?.('idle', 0)).toBe('idle');
  });

  it('leaves auth as undefined when it is absent from state', () => {
    const state = { registration: { error: null } };
    expect(options.stateSanitizer?.(state, 0)).toEqual({
      registration: { error: null },
      auth: undefined,
    });
  });

  it('returns original action unchanged when meta fields are non-object scalars', () => {
    const action = {
      type: 'noop',
      meta: { arg: 'plain-string', headers: 42, request: null },
    };
    const result = options.actionSanitizer?.(action, 0);
    expect(result).toBe(action);
  });
});
