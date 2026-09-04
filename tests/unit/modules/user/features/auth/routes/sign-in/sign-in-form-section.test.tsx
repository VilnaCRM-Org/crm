import { screen } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import SignInFormSection from '@auth/routes/sign-in/sign-in-form-section';
import renderWithProviders from '@tests/unit/utils/render-with-providers';

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
  it('keeps the OAuth provider row interactive', () => {
    renderWithProviders(<SignInFormSection />);

    expect(
      screen.getByRole('group', { name: 'auth-provider-buttons-container inert=false' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('group', { name: 'auth-provider-buttons-container inert=true' })
    ).not.toBeInTheDocument();
  });

  it('composes the login form with the sign-up switcher', () => {
    renderWithProviders(<SignInFormSection />);

    expect(screen.getByRole('form', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Don’t have an account yet?' })).toBeInTheDocument();
  });
});
