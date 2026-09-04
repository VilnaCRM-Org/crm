import { render, screen } from '@testing-library/react';

interface AuthErrorShape {
  displayMessage: string;
}

const authStoreState: { loginError: AuthErrorShape | null; loginLoading: boolean } = {
  loginError: null,
  loginLoading: false,
};

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({ t: (key: string): string => key }),
}));

jest.mock('@auth/assets/eye.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@auth/assets/eye-off.svg', () => ({ ReactComponent: 'svg' }));

jest.mock('@auth/stores', () => ({
  __esModule: true,
  useAuthState: (): typeof authStoreState => authStoreState,
  authActions: { loginUser: jest.fn(), clearLoginError: jest.fn() },
  AuthStoreSelectors: {
    loginError: (state: typeof authStoreState): AuthErrorShape | null => state.loginError,
    loginLoading: (state: typeof authStoreState): boolean => state.loginLoading,
  },
}));

/**
 * The login defaults are a module-level constant, so they are built the moment the module is
 * imported. Importing inside the test keeps that constant under test rather than letting it be
 * built while the suite is still being collected.
 */
describe('LoginForm default values', () => {
  it('starts the sign-in form with both credential fields empty', async () => {
    const { default: LoginForm } =
      await import('@auth/components/form-section/auth-forms/login-form');

    render(<LoginForm />);

    expect(screen.getByPlaceholderText('sign_in.form.email_input.placeholder')).toHaveValue('');
    expect(screen.getByPlaceholderText('sign_in.form.password_input.placeholder')).toHaveValue('');
  });
});
