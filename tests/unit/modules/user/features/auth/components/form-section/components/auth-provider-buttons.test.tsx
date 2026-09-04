import { fireEvent, screen } from '@testing-library/react';
import type { ReactElement } from 'react';

import urlBuilder from '@/utils/url-builder';
import AuthProviderButtons from '@auth/components/form-section/components/auth-provider-buttons';
import browserNavigator from '@auth/utils/browser-navigator';
import renderWithProviders from '@tests/unit/utils/render-with-providers';

type SvgModule = { ReactComponent: () => ReactElement };

function mockSvgModule(): SvgModule {
  return { ReactComponent: (): ReactElement => <svg /> };
}

jest.mock('@auth/assets/social-links/google-color.svg', mockSvgModule);
jest.mock('@auth/assets/social-links/github-color.svg', mockSvgModule);
jest.mock('@auth/assets/social-links/facebook-color.svg', mockSvgModule);
jest.mock('@auth/assets/social-links/twitter-color.svg', mockSvgModule);

const PROVIDER_LABELS = ['Google', 'GitHub', 'Facebook', 'Twitter'];
const OAUTH_BASE_URL = 'https://oauth.vilnacrm.test';

// `urlBuilder.build` returns its argument unchanged when no base URL resolves, so asserting the
// bare endpoint would pass whether or not the endpoint was ever built. Stub the base instead.
function stubEndpointBuilder(): jest.SpyInstance {
  return jest
    .spyOn(urlBuilder, 'build')
    .mockImplementation((endpoint: string) => `${OAUTH_BASE_URL}${endpoint}`);
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('AuthProviderButtons', () => {
  it('renders one icon button per provider, in design order, with localized names', () => {
    renderWithProviders(<AuthProviderButtons />);

    const names = screen.getAllByRole('button').map((button) => button.getAttribute('aria-label'));
    expect(names).toEqual(PROVIDER_LABELS.map((label) => `Continue with ${label}`));
  });

  it('navigates to the provider auth endpoint on click', () => {
    const buildSpy = stubEndpointBuilder();
    const openSpy = jest
      .spyOn(browserNavigator, 'openInNewTab')
      .mockImplementation(() => undefined);
    renderWithProviders(<AuthProviderButtons />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));

    expect(buildSpy).toHaveBeenCalledWith('/auth/google');
    expect(openSpy).toHaveBeenCalledWith(`${OAUTH_BASE_URL}/auth/google`);
  });

  it('uses the provider key, not its display label, in the endpoint', () => {
    const buildSpy = stubEndpointBuilder();
    const openSpy = jest
      .spyOn(browserNavigator, 'openInNewTab')
      .mockImplementation(() => undefined);
    renderWithProviders(<AuthProviderButtons />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue with GitHub' }));

    expect(buildSpy).toHaveBeenCalledWith('/auth/github');
    expect(openSpy).toHaveBeenCalledWith(`${OAUTH_BASE_URL}/auth/github`);
  });
});
