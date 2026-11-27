import type { OAuthProvider } from '@auth/types/auth-provider-buttons/oauth-providers';
import loadIsolated from '@tests/unit/utils/isolated-module';

jest.mock('@/assets/icons/social/facebook-color.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/icons/social/github-color.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/icons/social/google-color.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/icons/social/twitter-color.svg', () => ({ ReactComponent: 'svg' }));

interface IsolatedProviders {
  providers: ReadonlyArray<OAuthProvider>;
  start: jest.Mock;
}

// The provider table is a module-level literal, so it is only evaluated inside the test when the
// module is loaded here. The start handler it calls is handed in, so no collaborator is spied on.
function loadProviders(): Promise<IsolatedProviders> {
  return loadIsolated(async () => {
    const oauthProviders = (
      await import('@auth/components/form-section/components/auth-provider-buttons/oauth-providers')
    ).default;
    const start = jest.fn();

    return { providers: oauthProviders.list(start).items, start };
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
  ])('starts the %s flow with its provider key', async (label, key) => {
    const { providers, start } = await loadProviders();

    providerFor(providers, label).onClick();

    expect(start).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledWith(key);
  });
});
