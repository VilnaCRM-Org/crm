// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import type { ReactElement } from 'react';

import SignIn from '@/modules/user/features/auth/routes/sign-in';
import renderWithProviders from '@tests/unit/utils/render-with-providers';

jest.mock('@auth/components/form-section/auth-forms/use-login-submitter', () => ({
  __esModule: true,
  default: (): { error: null; isSubmitting: boolean; handleLogin: jest.Mock } => ({
    error: null,
    isSubmitting: false,
    handleLogin: jest.fn(),
  }),
}));

jest.mock('@auth/components/form-section/validations', () => ({
  __esModule: true,
  default: { create: (): Record<string, never> => ({}) },
}));

jest.mock('@auth/components/form-section/auth-forms/login-form-fields', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="form-fields" />,
}));

jest.mock('@auth/components/form-section/components/auth-provider-buttons', () => ({
  __esModule: true,
  default: (): ReactElement => <div>oauth-row</div>,
}));

jest.mock('@/components/ui-back-to-main', () => ({
  __esModule: true,
  default: (): ReactElement => <div>auth shell header</div>,
}));

jest.mock('@/components/ui-footer', () => ({
  __esModule: true,
  default: (): ReactElement => <div>auth shell footer</div>,
}));

jest.mock('@/components/skeletons/auth-skeleton', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="auth-shell-skeleton" />,
}));

const OAUTH_FLAG = 'REACT_APP_FEATURE_OAUTH_PROVIDERS';
const ORIGINAL_ENV = { ...process.env };

describe('SignIn page', () => {
  beforeEach(() => {
    document.title = '';
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('renders chrome, the h1, the swap link, and the page title (AC1-AC3)', async () => {
    renderWithProviders(<SignIn />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Authentication' })
    ).toBeInTheDocument();
    expect(screen.getByText('auth shell header')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('auth shell footer')).toBeInTheDocument();
    expect(screen.queryByText('oauth-row')).not.toBeInTheDocument();

    const link = screen.getByRole('link', { name: 'Don’t have an account yet?' });
    expect(link).toHaveAttribute('href', '/sign-up');
    expect(document.title).toBe('Authentication - VilnaCRM');
  });

  it('renders the OAuth row only when the OAuth flag is on (issue #150)', async () => {
    process.env[OAUTH_FLAG] = 'true';
    renderWithProviders(<SignIn />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Authentication' })
    ).toBeInTheDocument();
    expect(screen.getByText('oauth-row')).toBeInTheDocument();
  });
});
