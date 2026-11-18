import { fireEvent, screen } from '@testing-library/react';
import type { ReactElement } from 'react';

import API_ENDPOINTS from '@/config/api-config';
import AuthProviderButtons from '@auth/components/form-section/components/auth-provider-buttons';
import browserNavigator from '@auth/utils/browser-navigator';
import renderWithProviders from '@tests/unit/utils/render-with-providers';

type SvgModule = { ReactComponent: () => ReactElement };

function mockSvgModule(): SvgModule {
  return { ReactComponent: (): ReactElement => <svg /> };
}

jest.mock('@/assets/icons/social/google-color.svg', mockSvgModule);
jest.mock('@/assets/icons/social/github-color.svg', mockSvgModule);
jest.mock('@/assets/icons/social/facebook-color.svg', mockSvgModule);
jest.mock('@/assets/icons/social/twitter-color.svg', mockSvgModule);

const PROVIDER_LABELS = ['Google', 'Facebook', 'GitHub', 'Twitter'];
afterEach(() => {
  jest.restoreAllMocks();
});

describe('AuthProviderButtons against the real i18n catalogue', () => {
  it('renders one icon button per provider, in design order, with localized names', () => {
    renderWithProviders(<AuthProviderButtons />);

    const names = screen.getAllByRole('button').map((button) => button.getAttribute('aria-label'));
    expect(names).toEqual(PROVIDER_LABELS.map((label) => `Continue with ${label}`));
  });

  it('navigates to the provider auth endpoint on click', () => {
    const assign = jest.spyOn(browserNavigator, 'assign').mockImplementation(() => undefined);
    renderWithProviders(<AuthProviderButtons />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));

    expect(assign).toHaveBeenCalledWith(`${API_ENDPOINTS.SOCIAL_AUTH}/google`);
  });

  it('uses the provider key, not its display label, in the endpoint', () => {
    const assign = jest.spyOn(browserNavigator, 'assign').mockImplementation(() => undefined);
    renderWithProviders(<AuthProviderButtons />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue with GitHub' }));

    expect(assign).toHaveBeenCalledWith(`${API_ENDPOINTS.SOCIAL_AUTH}/github`);
  });
});
