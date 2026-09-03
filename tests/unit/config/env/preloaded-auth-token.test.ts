import preloadedAuthTokenSeed from '@/config/env/preloaded-auth-token';
import { buildToken } from '@tests/builders';
import { PRELOADED_AUTH_TOKEN_WINDOW_KEY } from '@tests/utils/seed-preloaded-auth-token';

const ENV_KEY = 'REACT_APP_LHCI_PRELOADED_AUTH_TOKEN';
const OPT_IN_KEY = 'ENABLE_PRELOADED_AUTH_TOKEN_SEED';

describe('preloadedAuthTokenSeed', () => {
  const originalWindow = global.window;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env[ENV_KEY];
    delete process.env[OPT_IN_KEY];
    delete window[PRELOADED_AUTH_TOKEN_WINDOW_KEY];
  });

  afterEach(() => {
    Object.defineProperty(global, 'window', { configurable: true, value: originalWindow });
    Object.defineProperty(process, 'env', { configurable: true, value: originalEnv });
    delete window[PRELOADED_AUTH_TOKEN_WINDOW_KEY];
  });

  describe('outside a production build', () => {
    it('prefers the trimmed window token over the env token', () => {
      const windowToken = buildToken();
      process.env[ENV_KEY] = buildToken();

      expect(
        preloadedAuthTokenSeed.read({ [PRELOADED_AUTH_TOKEN_WINDOW_KEY]: ` ${windowToken} ` })
      ).toBe(windowToken);
    });

    it('falls back to the trimmed env token when the window carries none', () => {
      const envToken = buildToken();
      process.env[ENV_KEY] = ` ${envToken} `;

      expect(preloadedAuthTokenSeed.read({})).toBe(envToken);
    });

    it('returns null when neither source carries a token', () => {
      expect(preloadedAuthTokenSeed.read({})).toBeNull();
    });

    it('reads the ambient window when no window is passed', () => {
      const windowToken = buildToken();
      window[PRELOADED_AUTH_TOKEN_WINDOW_KEY] = windowToken;

      expect(preloadedAuthTokenSeed.read()).toBe(windowToken);
    });

    it('uses the env token when there is no window at all', () => {
      const envToken = buildToken();
      Object.defineProperty(global, 'window', { configurable: true, value: undefined });
      process.env[ENV_KEY] = envToken;

      expect(preloadedAuthTokenSeed.read()).toBe(envToken);
    });

    it('returns null when there is no window and no env token', () => {
      Object.defineProperty(global, 'window', { configurable: true, value: undefined });

      expect(preloadedAuthTokenSeed.read()).toBeNull();
    });

    it('ignores a blank window token and a blank env token', () => {
      process.env[ENV_KEY] = '   ';

      expect(preloadedAuthTokenSeed.read({ [PRELOADED_AUTH_TOKEN_WINDOW_KEY]: '   ' })).toBeNull();
    });
  });

  describe('in a production build', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('returns null even when both seed sources are set (issue #158)', () => {
      process.env[ENV_KEY] = buildToken();

      expect(
        preloadedAuthTokenSeed.read({ [PRELOADED_AUTH_TOKEN_WINDOW_KEY]: buildToken() })
      ).toBeNull();
    });

    it('returns null for an ambient window token', () => {
      window[PRELOADED_AUTH_TOKEN_WINDOW_KEY] = buildToken();

      expect(preloadedAuthTokenSeed.read()).toBeNull();
    });

    it('still seeds when the build explicitly opted in, which only the test image does', () => {
      const windowToken = buildToken();
      process.env[OPT_IN_KEY] = 'true';

      expect(preloadedAuthTokenSeed.read({ [PRELOADED_AUTH_TOKEN_WINDOW_KEY]: windowToken })).toBe(
        windowToken
      );
    });

    it('treats any opt-in value other than the exact "true" flag as disabled', () => {
      process.env[OPT_IN_KEY] = '1';

      expect(
        preloadedAuthTokenSeed.read({ [PRELOADED_AUTH_TOKEN_WINDOW_KEY]: buildToken() })
      ).toBeNull();
    });
  });
});
