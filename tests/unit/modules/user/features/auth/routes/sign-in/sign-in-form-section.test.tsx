import { screen } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import SignInFormSection from '@auth/routes/sign-in/sign-in-form-section';
import { buildFeatureFlagConfig } from '@tests/builders';
import renderWithProviders from '@tests/unit/utils/render-with-providers';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';

jest.mock('@auth/components/form-section/auth-forms/login-form', () => ({
  __esModule: true,
  default: (): ReactElement => <form aria-label="Login" />,
}));

jest.mock('@auth/components/form-section/components/auth-provider-buttons', () => ({
  __esModule: true,
  default: (): ReactElement => <button type="button">Continue with Google</button>,
}));

// The real InertBox writes the flag to a bare `inert` attribute on an unlabelled div, which
// neither jsdom nor Testing Library exposes to a semantic query. The stub keeps the prop flowing
// through the real AuthFormSection and re-publishes it as the group's accessible name.
jest.mock('@auth/components/form-section/inert-box', () => ({
  __esModule: true,
  default: ({
    id,
    inert,
    children,
  }: {
    id: string;
    inert: boolean;
    children: ReactNode;
  }): ReactElement => (
    <div role="group" aria-label={`${id} inert=${String(inert)}`}>
      {children}
    </div>
  ),
}));

describe('SignInFormSection', () => {
  afterEach(() => {
    clearConfigBlock();
  });

  // The provider row ships hidden (issue #150), so the interactivity contract is asserted
  // against the flag-on state; the default-off case is the test below it.
  it('keeps the OAuth provider row interactive when the flag is on', () => {
    writeConfigBlock(buildFeatureFlagConfig({ oauthProviders: true }));

    renderWithProviders(<SignInFormSection />);

    expect(
      screen.getByRole('group', { name: 'auth-provider-buttons-container inert=false' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('group', { name: 'auth-provider-buttons-container inert=true' })
    ).not.toBeInTheDocument();
  });

  it('renders no provider row at all while the flag is off', () => {
    renderWithProviders(<SignInFormSection />);

    expect(
      screen.queryByRole('group', { name: /auth-provider-buttons-container/ })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue with Google' })).not.toBeInTheDocument();
  });

  it('composes the login form with the sign-up switcher', () => {
    writeConfigBlock(buildFeatureFlagConfig({ oauthProviders: true }));

    renderWithProviders(<SignInFormSection />);

    expect(screen.getByRole('form', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Don’t have an account yet?' })).toBeInTheDocument();
  });
});
