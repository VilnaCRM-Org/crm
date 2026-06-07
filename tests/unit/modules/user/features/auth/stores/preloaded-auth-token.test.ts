import PreloadedAuthToken from '@auth/stores/preloaded-auth-token';
import type { PreloadedAuthWindow } from '@auth/types/preloaded-auth-token';

describe('PreloadedAuthToken.read', () => {
  it('prefers the trimmed token injected on window', () => {
    const token = PreloadedAuthToken.read(
      { [PreloadedAuthToken.key]: ' window-token ' } as PreloadedAuthWindow,
      ' env-token '
    );
    expect(token).toBe('window-token');
  });

  it('falls back to the trimmed env token when window has none', () => {
    expect(PreloadedAuthToken.read({} as PreloadedAuthWindow, ' env-token ')).toBe('env-token');
  });

  it('returns undefined when neither source has a token', () => {
    expect(PreloadedAuthToken.read({} as PreloadedAuthWindow, undefined)).toBeUndefined();
  });

  it('uses the default process env token when invoked with no args', () => {
    const originalWindow = global.window;
    const originalEnvToken = process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN;

    Object.defineProperty(global, 'window', { configurable: true, value: undefined });
    process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN = 'env-token';

    expect(PreloadedAuthToken.read()).toBe('env-token');

    Object.defineProperty(global, 'window', { configurable: true, value: originalWindow });
    if (originalEnvToken === undefined) {
      delete process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN;
    } else {
      process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN = originalEnvToken;
    }
  });

  it('reads the window token by default when window is present', () => {
    const originalValue = window.__PRELOADED_AUTH_TOKEN__;
    window.__PRELOADED_AUTH_TOKEN__ = 'win-default';
    expect(PreloadedAuthToken.read(undefined, undefined)).toBe('win-default');
    if (originalValue === undefined) delete window.__PRELOADED_AUTH_TOKEN__;
    else window.__PRELOADED_AUTH_TOKEN__ = originalValue;
  });

  it('returns undefined when process.env access throws', () => {
    const originalEnv = process.env;
    const throwingEnv = new Proxy(process.env, {
      get(_target: NodeJS.ProcessEnv, prop: string | symbol): unknown {
        if (prop === 'REACT_APP_LHCI_PRELOADED_AUTH_TOKEN') throw new Error('no env access');
        return Reflect.get(_target, prop);
      },
    });
    Object.defineProperty(process, 'env', { configurable: true, value: throwingEnv });

    // Call without providing envToken so fromEnv() default executes and throws
    expect(PreloadedAuthToken.read({} as PreloadedAuthWindow)).toBeUndefined();

    Object.defineProperty(process, 'env', { configurable: true, value: originalEnv });
  });
});
