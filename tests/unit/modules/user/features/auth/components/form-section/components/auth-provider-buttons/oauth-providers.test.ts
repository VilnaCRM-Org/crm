/** @jest-environment @stryker-mutator/jest-runner/jest-env/node */

import type { OAuthProvider } from '@auth/types/auth-provider-buttons/oauth-providers';

jest.mock('@auth/assets/social-links/facebook-color.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@auth/assets/social-links/github-color.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@auth/assets/social-links/google-color.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@auth/assets/social-links/twitter-color.svg', () => ({ ReactComponent: 'svg' }));

const OAUTH_BASE_URL = 'https://oauth.vilnacrm.test';
const INITIAL_HREF = 'https://app.vilnacrm.test/sign-in';

type WindowStub = {
  open: jest.Mock;
  location: { href: string };
};

type GlobalWithWindow = { window?: WindowStub };

const globalScope = globalThis as unknown as GlobalWithWindow;

let originalMockoonUrl: string | undefined;

function installWindow(openResult: unknown): WindowStub {
  const stub: WindowStub = {
    open: jest.fn().mockReturnValue(openResult),
    location: { href: INITIAL_HREF },
  };

  globalScope.window = stub;

  return stub;
}

function removeWindow(): void {
  delete globalScope.window;
}

async function loadProviders(): Promise<ReadonlyArray<OAuthProvider>> {
  jest.resetModules();

  const providersModule =
    await import('@auth/components/form-section/components/auth-provider-buttons/oauth-providers');

  return providersModule.default;
}

function providerFor(providers: ReadonlyArray<OAuthProvider>, label: string): OAuthProvider {
  const provider = providers.find((candidate) => candidate.label === label);

  if (!provider) {
    throw new Error(`No OAuth provider registered for "${label}"`);
  }

  return provider;
}

describe('oauthProviders', () => {
  beforeAll(() => {
    originalMockoonUrl = process.env.REACT_APP_MOCKOON_URL;
    process.env.REACT_APP_MOCKOON_URL = OAUTH_BASE_URL;
  });

  afterAll(() => {
    if (originalMockoonUrl === undefined) {
      delete process.env.REACT_APP_MOCKOON_URL;
      return;
    }

    process.env.REACT_APP_MOCKOON_URL = originalMockoonUrl;
  });

  afterEach(() => {
    removeWindow();
  });

  // The accessible name is no longer carried on the provider record: it is localized in the
  // component (`auth.oauth.continue_with`) and asserted in auth-provider-buttons.test.tsx.
  it('exposes every supported provider with an icon and a click handler', async () => {
    const providers = await loadProviders();

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

  it('opens the provider authorization page in a new isolated tab', async () => {
    const stub = installWindow({ closed: false });
    const providers = await loadProviders();

    providerFor(providers, 'Google').onClick();

    expect(stub.open).toHaveBeenCalledTimes(1);
    expect(stub.open).toHaveBeenCalledWith(
      `${OAUTH_BASE_URL}/auth/google`,
      '_blank',
      'noopener,noreferrer'
    );
    expect(stub.location.href).toBe(INITIAL_HREF);
  });

  it('encodes the provider into the authorization path of every provider', async () => {
    const stub = installWindow({ closed: false });
    const providers = await loadProviders();

    providerFor(providers, 'Twitter').onClick();

    expect(stub.open).toHaveBeenCalledWith(
      `${OAUTH_BASE_URL}/auth/twitter`,
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('falls back to same-tab navigation when the popup is blocked', async () => {
    const stub = installWindow(null);
    const providers = await loadProviders();

    providerFor(providers, 'GitHub').onClick();

    expect(stub.open).toHaveBeenCalledWith(
      `${OAUTH_BASE_URL}/auth/github`,
      '_blank',
      'noopener,noreferrer'
    );
    expect(stub.location.href).toBe(`${OAUTH_BASE_URL}/auth/github`);
  });

  it('stays inert when no browser window is available', async () => {
    removeWindow();

    expect(typeof window).toBe('undefined');

    const providers = await loadProviders();

    expect(() => providerFor(providers, 'Facebook').onClick()).not.toThrow();
  });
});
