import {
  getPreloadedAuthToken,
  preloadedAuthTokenKey,
  type PreloadedAuthWindow,
} from '@/stores/preloaded-auth-token';

describe('preloaded-auth-token (integration)', () => {
  it('prefers a window-injected token over the env token', () => {
    expect(
      getPreloadedAuthToken(
        { [preloadedAuthTokenKey]: ' window-token ' } as PreloadedAuthWindow,
        ' env-token '
      )
    ).toBe('window-token');
  });

  it('falls back to env token when window token is whitespace-only', () => {
    expect(
      getPreloadedAuthToken({ [preloadedAuthTokenKey]: '   ' } as PreloadedAuthWindow, 'env-token')
    ).toBe('env-token');
  });

  it('returns undefined when both window and env tokens are whitespace-only', () => {
    expect(
      getPreloadedAuthToken({ [preloadedAuthTokenKey]: '   ' } as PreloadedAuthWindow, '   ')
    ).toBeUndefined();
  });

  it('returns undefined when process.env is unavailable', () => {
    const originalProcess = global.process;

    Object.defineProperty(global, 'process', {
      configurable: true,
      value: undefined,
    });

    try {
      expect(getPreloadedAuthToken()).toBeUndefined();
    } finally {
      Object.defineProperty(global, 'process', {
        configurable: true,
        value: originalProcess,
      });
    }
  });

  it('uses env token when window is unavailable', () => {
    const originalWindow = global.window;
    const originalEnvToken = process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN;

    Object.defineProperty(global, 'window', {
      configurable: true,
      value: undefined,
    });
    process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN = 'env-token';

    try {
      expect(getPreloadedAuthToken()).toBe('env-token');
    } finally {
      Object.defineProperty(global, 'window', {
        configurable: true,
        value: originalWindow,
      });
      if (originalEnvToken === undefined) {
        delete process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN;
      } else {
        process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN = originalEnvToken;
      }
    }
  });
});
