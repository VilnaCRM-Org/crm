import { fireEvent, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Route, Routes } from 'react-router';

import AuthProviderButtons from '@auth/components/form-section/components/auth-provider-buttons';
import socialSignInFlowSource from '@auth/utils/social-sign-in-flow-source';
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

  it('opens the social callback page to start the flow, saving the destination', async () => {
    const save = jest.spyOn(socialSignInFlowSource, 'saveDestination');
    renderWithProviders(
      <Routes>
        <Route path="/" element={<AuthProviderButtons />} />
        <Route path="/auth/callback/:provider" element={<p>callback page</p>} />
      </Routes>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Continue with GitHub' }));

    expect(await screen.findByText('callback page')).toBeInTheDocument();
    expect(save).toHaveBeenCalledWith(null);
  });
});
