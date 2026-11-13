// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { ThemeProvider } from '@mui/material/styles';
import { act, render, type RenderResult, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';

import SignIn from '@/modules/user/features/auth/routes/sign-in';
import ROUTE_PATHS from '@/routes/route-paths';
import useAuthStore from '@auth/stores/use-auth-store';
import { buildPendingSessionId, buildToken } from '@tests/builders';
import renderWithProviders, { testI18n, testTheme } from '@tests/unit/utils/render-with-providers';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';
import { resetClientStores } from '@tests/utils/reset-client-stores';

jest.mock('@auth/components/form-section/auth-forms/use-login-submitter', () => ({
  __esModule: true,
  default: (): {
    error: string;
    isSubmitting: boolean;
    handleLogin: jest.Mock;
    handleRetry: jest.Mock;
    handleBack: jest.Mock;
  } => ({
    error: '',
    isSubmitting: false,
    handleLogin: jest.fn(),
    handleRetry: jest.fn(),
    handleBack: jest.fn(),
  }),
}));

jest.mock('@/assets/notification/confetti.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/notification/error.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/notification/settings.svg', () => ({ ReactComponent: 'svg' }));

jest.mock('@/modules/user/lib/validations', () => ({
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
const CHALLENGE_TEXT = 'challenge page';

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
    resetClientStores();
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
    it('confirms the sign-in, then returns to the preserved protected destination', async () => {
      renderSignInRoute();
      expect(
        await screen.findByRole('heading', { level: 1, name: 'Authentication' })
      ).toBeInTheDocument();
      expect(screen.queryByText(DESTINATION_TEXT)).not.toBeInTheDocument();

      act(() => useAuthStore.setState({ token: buildToken() }));

      expect(await screen.findByRole('heading', { level: 2, name: 'Welcome back!' })).toHaveFocus();
      expect(screen.queryByText(DESTINATION_TEXT)).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

      expect(await screen.findByText(DESTINATION_TEXT)).toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { level: 1, name: 'Authentication' })
      ).not.toBeInTheDocument();
    });

    it('stays on the sign-in page when it mounts with a token already present', async () => {
      useAuthStore.setState({ token: buildToken() });

      renderSignInRoute();

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Authentication' })
      ).toBeInTheDocument();
      expect(screen.queryByText(DESTINATION_TEXT)).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    });
  });

  it('shows the password-reset notice after the lazy section mounts and focuses main', async () => {
    const { container } = render(
      <MemoryRouter
        initialEntries={[
          { pathname: ROUTE_PATHS.signIn, state: { focusMain: true, notice: 'password_reset' } },
        ]}
      >
        <ThemeProvider theme={testTheme}>
          <I18nextProvider i18n={testI18n}>
            <Routes>
              <Route path={ROUTE_PATHS.signIn} element={<SignIn />} />
            </Routes>
          </I18nextProvider>
        </ThemeProvider>
      </MemoryRouter>
    );

    const message = 'Your password has been changed. Sign in with your new password.';
    expect(await screen.findByText(message)).toBeInTheDocument();
    const notices = screen
      .getAllByRole('status')
      .filter((region) => region.textContent === message);
    expect(notices).toHaveLength(1);
    expect(
      screen.getByRole('heading', { level: 1 }).compareDocumentPosition(notices[0] as HTMLElement) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByRole('main')).toHaveFocus();
    await expectNoA11yViolations(container);
  });

  it('renders no notice region on a resting visit', async () => {
    renderWithProviders(<SignIn />);

    await screen.findByRole('heading', { level: 1, name: 'Authentication' });
    expect(screen.queryByText(/Your password has been changed/)).not.toBeInTheDocument();
  });

  describe('two-factor hand-off (issue #331)', () => {
    it('discards a pending session when the page is reached', async () => {
      useAuthStore.setState({ pendingSessionId: buildPendingSessionId() });

      renderWithProviders(<SignIn />);

      await screen.findByRole('heading', { level: 1, name: 'Authentication' });
      expect(useAuthStore.getState().pendingSessionId).toBeNull();
    });

    it('moves to the challenge route with the from target when a session appears', async () => {
      const entry = {
        pathname: ROUTE_PATHS.signIn,
        state: { from: { pathname: PROTECTED_DESTINATION } },
      };
      render(
        <MemoryRouter initialEntries={[entry]}>
          <ThemeProvider theme={testTheme}>
            <I18nextProvider i18n={testI18n}>
              <Routes>
                <Route path={ROUTE_PATHS.signIn} element={<SignIn />} />
                <Route path={ROUTE_PATHS.twoFactorChallenge} element={<p>{CHALLENGE_TEXT}</p>} />
              </Routes>
            </I18nextProvider>
          </ThemeProvider>
        </MemoryRouter>
      );
      await screen.findByRole('heading', { level: 1, name: 'Authentication' });

      act(() => useAuthStore.setState({ pendingSessionId: buildPendingSessionId() }));

      expect(await screen.findByText(CHALLENGE_TEXT)).toBeInTheDocument();
      expect(useAuthStore.getState().token).toBeNull();
    });
  });
});
