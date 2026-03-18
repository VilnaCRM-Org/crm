import { getPreloadedAuthToken } from '@/stores/preloaded-auth-token';

describe('store preloaded auth token', () => {
  const originalWindow = global.window;
  const originalEnvToken = process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN;

  afterEach(() => {
    if (originalWindow === undefined) {
      // @ts-expect-error test cleanup for optional window
      delete global.window;
    } else {
      global.window = originalWindow;
    }

    if (originalEnvToken === undefined) {
      delete process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN;
    } else {
      process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN = originalEnvToken;
    }
  });

  it('prefers the window token when it is present', () => {
    expect(
      getPreloadedAuthToken(
        { __PRELOADED_AUTH_TOKEN__: 'window-token' } as Window,
        'env-token'
      )
    ).toBe('window-token');
  });

  it('uses the Lighthouse auth token env var when no window token is present', () => {
    expect(getPreloadedAuthToken(undefined, '  lighthouse-preloaded-auth-token  ')).toBe(
      'lighthouse-preloaded-auth-token'
    );
  });

  it('returns undefined when neither source provides a token', () => {
    expect(getPreloadedAuthToken({ __PRELOADED_AUTH_TOKEN__: '' } as Window, '   ')).toBeUndefined();
  });

  it('returns undefined when envToken is undefined', () => {
    expect(getPreloadedAuthToken(undefined, undefined)).toBeUndefined();
  });

  it('uses the default window and env lookups when arguments are omitted', () => {
    Object.defineProperty(global, 'window', {
      value: { __PRELOADED_AUTH_TOKEN__: 'window-default-token' },
      writable: true,
      configurable: true,
    });
    process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN = 'env-default-token';

    expect(getPreloadedAuthToken()).toBe('window-default-token');
  });

  it('falls back to the env token when window is unavailable and arguments are omitted', () => {
    // @ts-expect-error simulate a non-browser runtime for default parameter coverage
    delete global.window;
    process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN = 'env-default-token';

    expect(getPreloadedAuthToken()).toBe('env-default-token');
  });
});
