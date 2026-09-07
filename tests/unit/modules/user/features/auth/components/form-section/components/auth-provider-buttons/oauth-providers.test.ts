import type UrlBuilder from '@/utils/url-builder';
import type { OAuthProvider } from '@auth/types/auth-provider-buttons/oauth-providers';
import type BrowserNavigator from '@auth/utils/browser-navigator';
import loadIsolated from '@tests/unit/utils/isolated-module';

jest.mock('@auth/assets/social-links/facebook-color.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@auth/assets/social-links/github-color.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@auth/assets/social-links/google-color.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@auth/assets/social-links/twitter-color.svg', () => ({ ReactComponent: 'svg' }));

const OAUTH_BASE_URL = 'https://oauth.vilnacrm.test';

interface IsolatedProviders {
  providers: ReadonlyArray<OAuthProvider>;
  urlBuilder: typeof UrlBuilder;
  browserNavigator: typeof BrowserNavigator;
}

// The provider table is a module-level literal, so it is only evaluated inside the test when the
// module is loaded here. Its two collaborators are loaded from the same isolated registry, or the
// spies below would sit on different singletons than the ones the handler calls.
function loadProviders(): Promise<IsolatedProviders> {
  return loadIsolated(async () => {
    const urlBuilder = (await import('@/utils/url-builder')).default;
    const browserNavigator = (await import('@auth/utils/browser-navigator')).default;
    const providers = (
      await import('@auth/components/form-section/components/auth-provider-buttons/oauth-providers')
    ).default;

    return { providers, urlBuilder, browserNavigator };
  });
}

function providerFor(providers: ReadonlyArray<OAuthProvider>, label: string): OAuthProvider {
  const provider = providers.find((candidate) => candidate.label === label);

  if (!provider) {
    throw new Error(`No OAuth provider registered for "${label}"`);
  }

  return provider;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('oauthProviders', () => {
  it('exposes every supported provider, in design order, with an icon and a handler', async () => {
    const { providers } = await loadProviders();

    expect(providers.map((provider) => provider.label)).toEqual([
      'Google',
      'GitHub',
      'Facebook',
      'Twitter',
    ]);

    providers.forEach((provider) => {
      expect(provider.SvgComponent).toBeDefined();
      expect(typeof provider.onClick).toBe('function');
    });
  });

  // The base URL is stubbed rather than inherited from the environment: `urlBuilder.build` returns
  // its argument unchanged when no base resolves, which would let the assertion below pass without
  // the endpoint ever being built.
  it.each([
    ['Google', 'google'],
    ['GitHub', 'github'],
    ['Facebook', 'facebook'],
    ['Twitter', 'twitter'],
  ])('opens the %s authorization endpoint in an isolated tab', async (label, key) => {
    const { providers, urlBuilder, browserNavigator } = await loadProviders();
    const buildSpy = jest
      .spyOn(urlBuilder, 'build')
      .mockImplementation((endpoint: string) => `${OAUTH_BASE_URL}${endpoint}`);
    const openSpy = jest
      .spyOn(browserNavigator, 'openInNewTab')
      .mockImplementation(() => undefined);

    providerFor(providers, label).onClick();

    expect(buildSpy).toHaveBeenCalledWith(`/auth/${key}`);
    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith(`${OAUTH_BASE_URL}/auth/${key}`);
  });
});
