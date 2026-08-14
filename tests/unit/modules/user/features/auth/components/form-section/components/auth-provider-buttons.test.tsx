import { fireEvent, screen } from '@testing-library/react';
import type { ReactElement } from 'react';

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
    const openSpy = jest
      .spyOn(browserNavigator, 'openInNewTab')
      .mockImplementation(() => undefined);
    renderWithProviders(<AuthProviderButtons />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));

    expect(openSpy).toHaveBeenCalledWith('/auth/google');
  });

  it('uses the provider key, not its display label, in the endpoint', () => {
    const openSpy = jest
      .spyOn(browserNavigator, 'openInNewTab')
      .mockImplementation(() => undefined);
    renderWithProviders(<AuthProviderButtons />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue with GitHub' }));

    expect(openSpy).toHaveBeenCalledWith('/auth/github');
  });
});
