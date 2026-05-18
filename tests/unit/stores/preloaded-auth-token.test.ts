import {
  getPreloadedAuthToken,
  preloadedAuthTokenKey,
  type PreloadedAuthWindow,
} from '@/stores/preloaded-auth-token';

describe('getPreloadedAuthToken', () => {
  it('prefers the token injected on window', () => {
    const token = getPreloadedAuthToken(
      {
        [preloadedAuthTokenKey]: ' window-token ',
      } as PreloadedAuthWindow,
      ' env-token '
    );

    expect(token).toBe('window-token');
  });

  it('uses the default process env token when window is unavailable', () => {
    const originalWindow = global.window;
    const originalEnvToken = process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN;

    Object.defineProperty(global, 'window', {
      configurable: true,
      value: undefined,
    });
    process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN = 'env-token';

    expect(getPreloadedAuthToken()).toBe('env-token');

    Object.defineProperty(global, 'window', {
      configurable: true,
      value: originalWindow,
    });
    if (originalEnvToken === undefined) {
      delete process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN;
    } else {
      process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN = originalEnvToken;
    }
  });

  it('returns undefined when process.env is unavailable', () => {
    const originalProcess = global.process;

    Object.defineProperty(global, 'process', {
      configurable: true,
      value: undefined,
    });

    expect(getPreloadedAuthToken()).toBeUndefined();

    Object.defineProperty(global, 'process', {
      configurable: true,
      value: originalProcess,
    });
  });

  it('returns undefined when the env token is unset', () => {
    expect(getPreloadedAuthToken(undefined, undefined)).toBeUndefined();
  });

  it('falls back to env token when window token is whitespace-only', () => {
    const token = getPreloadedAuthToken(
      { [preloadedAuthTokenKey]: '   ' } as PreloadedAuthWindow,
      'env-token'
    );

    expect(token).toBe('env-token');
  });

  it('returns undefined when both window and env tokens are whitespace-only', () => {
    const token = getPreloadedAuthToken(
      { [preloadedAuthTokenKey]: '   ' } as PreloadedAuthWindow,
      '   '
    );

    expect(token).toBeUndefined();
  });
});
