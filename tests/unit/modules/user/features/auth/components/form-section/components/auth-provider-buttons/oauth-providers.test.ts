import type { OAuthProvider } from '@auth/types/auth-provider-buttons/oauth-providers';
import type BrowserNavigator from '@auth/utils/browser-navigator';
import type SocialSignInDestinationSource from '@auth/utils/social-sign-in-destination-source';
import loadIsolated from '@tests/unit/utils/isolated-module';

jest.mock('@/assets/icons/social/facebook-color.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/icons/social/github-color.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/icons/social/google-color.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/icons/social/twitter-color.svg', () => ({ ReactComponent: 'svg' }));

const ROUTER_STATE = { from: { pathname: '/settings', search: '', hash: '' } };

interface IsolatedProviders {
  providers: ReadonlyArray<OAuthProvider>;
  socialAuthBase: string;
  browserNavigator: typeof BrowserNavigator;
  destination: typeof SocialSignInDestinationSource;
}

// The provider table is a module-level literal, so it is only evaluated inside the test when the
// module is loaded here. Its two collaborators are loaded from the same isolated registry, or the
// spies below would sit on different singletons than the ones the handler calls.
function loadProviders(): Promise<IsolatedProviders> {
  return loadIsolated(async () => {
    const socialAuthBase = (await import('@/config/api-config')).default.SOCIAL_AUTH;
    const browserNavigator = (await import('@auth/utils/browser-navigator')).default;
    const destination = (await import('@auth/utils/social-sign-in-destination-source')).default;
    const oauthProviders = (
      await import('@auth/components/form-section/components/auth-provider-buttons/oauth-providers')
    ).default;

    return {
      providers: oauthProviders.list(ROUTER_STATE).items,
      socialAuthBase,
      browserNavigator,
      destination,
    };
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
  // The accessible name is not carried on the provider record: it is localized in the component
  // (`auth.oauth.continue_with`) and asserted in the auth-provider-buttons component test.
  it('exposes every supported provider, in design order, with an icon and a handler', async () => {
    const { providers } = await loadProviders();

    expect(providers.map((provider) => provider.label)).toEqual([
      'Google',
      'Facebook',
      'GitHub',
      'Twitter',
    ]);

    providers.forEach((provider) => {
      expect(provider.SvgComponent).toBeDefined();
      expect(typeof provider.onClick).toBe('function');
    });
  });

  it.each([
    ['Google', 'google'],
    ['GitHub', 'github'],
    ['Facebook', 'facebook'],
    ['Twitter', 'twitter'],
  ])(
    'saves the destination and sends %s through the social initiate endpoint',
    async (label, key) => {
      const { providers, socialAuthBase, browserNavigator, destination } = await loadProviders();
      const save = jest.spyOn(destination, 'save').mockImplementation(() => undefined);
      const assign = jest.spyOn(browserNavigator, 'assign').mockImplementation(() => undefined);

      providerFor(providers, label).onClick();

      expect(save).toHaveBeenCalledWith(ROUTER_STATE);
      expect(assign).toHaveBeenCalledTimes(1);
      expect(assign).toHaveBeenCalledWith(`${socialAuthBase}/${key}`);
      expect(save.mock.invocationCallOrder[0]).toBeLessThan(
        assign.mock.invocationCallOrder[0] ?? 0
      );
    }
  );
});
