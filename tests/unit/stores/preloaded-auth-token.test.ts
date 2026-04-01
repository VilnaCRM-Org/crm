import {
  getPreloadedAuthToken,
  preloadedAuthTokenKey,
  type PreloadedAuthWindow,
} from '@/stores/preloaded-auth-token';
import fs from 'fs';
import path from 'path';

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
});
