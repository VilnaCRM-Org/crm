// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { ThemeProvider } from '@mui/material/styles';
import { act, render, type RenderResult, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';

import SignIn from '@/modules/user/features/auth/routes/sign-in';
import ROUTE_PATHS from '@/routes/route-paths';
import authStateVar from '@auth/stores/auth-var';
import { buildToken } from '@tests/builders';
import renderWithProviders, { testI18n, testTheme } from '@tests/unit/utils/render-with-providers';

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

const PROTECTED_DESTINATION = '/deals';
const DESTINATION_TEXT = 'protected destination';

function renderSignInRoute(): RenderResult {
  const entry = {
    pathname: ROUTE_PATHS.signIn,
    state: { from: { pathname: PROTECTED_DESTINATION, search: '?tab=open' } },
  };
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <ThemeProvider theme={testTheme}>
        <I18nextProvider i18n={testI18n}>
          <Routes>
            <Route path={ROUTE_PATHS.signIn} element={<SignIn />} />
            <Route path={PROTECTED_DESTINATION} element={<p>{DESTINATION_TEXT}</p>} />
          </Routes>
        </I18nextProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('SignIn page', () => {
  beforeEach(() => {
    document.title = '';
  });

  it('renders chrome, the h1, the swap link, and the page title (AC1-AC3)', async () => {
    renderWithProviders(<SignIn />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Authentication' })
    ).toBeInTheDocument();
    expect(screen.getByText('auth shell header')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('auth shell footer')).toBeInTheDocument();
    expect(screen.getByText('oauth-row')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: 'Don’t have an account yet?' });
    expect(link).toHaveAttribute('href', '/sign-up');
    expect(document.title).toBe('Authentication - VilnaCRM');
  });

  describe('post-login redirect (issue #150)', () => {
    beforeEach(() => authStateVar.reset());

    it('returns to the preserved protected destination once a token arrives', async () => {
      renderSignInRoute();
      expect(
        await screen.findByRole('heading', { level: 1, name: 'Authentication' })
      ).toBeInTheDocument();
      expect(screen.queryByText(DESTINATION_TEXT)).not.toBeInTheDocument();

      act(() => authStateVar.set({ token: buildToken() }));

      expect(await screen.findByText(DESTINATION_TEXT)).toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { level: 1, name: 'Authentication' })
      ).not.toBeInTheDocument();
    });

    it('stays on the sign-in page when it mounts with a token already present', async () => {
      authStateVar.set({ token: buildToken() });

      renderSignInRoute();

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Authentication' })
      ).toBeInTheDocument();
      expect(screen.queryByText(DESTINATION_TEXT)).not.toBeInTheDocument();
    });
  });
});
