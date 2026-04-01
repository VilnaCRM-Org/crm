import fs from 'fs';
import path from 'path';

import {
  getPreloadedAuthToken,
  preloadedAuthTokenKey,
  type PreloadedAuthWindow,
} from '@/stores/preloaded-auth-token';

describe('getPreloadedAuthToken', () => {
  it('prefers the token injected on window', () => {
    const token = getPreloadedAuthToken({
      [preloadedAuthTokenKey]: ' window-token ',
    } as PreloadedAuthWindow, ' env-token ');

    expect(token).toBe('window-token');
  });

  it('does not read process.env directly in the default parameter path', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../src/stores/preloaded-auth-token.ts'),
      'utf8'
    );

    expect(source).not.toContain('envToken: string | undefined = process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN');
  });

  it('does not gate the default env token behind a runtime process check', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../src/stores/preloaded-auth-token.ts'),
      'utf8'
    );

    expect(source).not.toContain("typeof process === 'undefined'");
    expect(source).not.toContain("typeof process !== 'undefined'");
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
    process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN = originalEnvToken;
  });

  it('returns undefined when process.env is unavailable', () => {
    const originalProcess = global.process;

    Object.defineProperty(global, 'process', {
      configurable: true,
      value: {},
    });

    expect(getPreloadedAuthToken()).toBeUndefined();

    Object.defineProperty(global, 'process', {
      configurable: true,
      value: originalProcess,
    });
  });
});
