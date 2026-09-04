// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { act } from 'react';
import type { ReactElement, ReactNode } from 'react';

import SignUp from '@/modules/user/features/auth/routes/sign-up';
import SignUpFormSection from '@/modules/user/features/auth/routes/sign-up/sign-up-form-section';
import type { RegistrationView } from '@auth/components/form-section/types';
import renderWithProviders from '@tests/unit/utils/render-with-providers';

type FormState = {
  view: RegistrationView;
  errorText: string;
  formKey: number;
  isSubmitting: boolean;
  showSubmitLoader: boolean;
  handleRegister: jest.Mock;
  handleSuccessShown: jest.Mock;
  handleBackToForm: jest.Mock;
  handleRetry: jest.Mock;
};

const mockFormState: FormState = {
  view: 'form',
  errorText: '',
  formKey: 0,
  isSubmitting: false,
  showSubmitLoader: false,
  handleRegister: jest.fn(),
  handleSuccessShown: jest.fn(),
  handleBackToForm: jest.fn(),
  handleRetry: jest.fn(),
};

let capturedOnViewChange: ((view: RegistrationView) => void) | undefined;

jest.mock('@auth/hooks/use-registration-form', () => ({
  __esModule: true,
  default: (onViewChange: (view: RegistrationView) => void): FormState => {
    capturedOnViewChange = onViewChange;
    return mockFormState;
  },
}));

jest.mock('@auth/components/form-section/validations', () => ({
  __esModule: true,
  default: { create: (): Record<string, never> => ({}) },
}));

jest.mock('@auth/utils/load-registration-notification', () => ({
  __esModule: true,
  default: {
    load: (): Promise<{ default: () => ReactElement }> =>
      Promise.resolve({ default: (): ReactElement => <div data-testid="reg-notification" /> }),
  },
}));

jest.mock('@auth/components/form-section/auth-forms/registration-form-fields', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="form-fields" />,
}));

jest.mock('@auth/components/form-section/components/auth-provider-buttons', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="oauth-row" />,
}));

jest.mock('@auth/components/form-section/inert-box', () => ({
  __esModule: true,
  default: ({
    id,
    inert,
    children,
  }: {
    id: string;
    inert?: boolean;
    children: ReactNode;
  }): ReactElement => (
    <div data-testid={id} data-inert={String(Boolean(inert))}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui-back-to-main', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="auth-shell-header" />,
}));

jest.mock('@/components/ui-footer', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="auth-shell-footer" />,
}));

jest.mock('@/components/skeletons/auth-skeleton', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="auth-shell-skeleton" />,
}));

describe('SignUp page', () => {
  beforeEach(() => {
    capturedOnViewChange = undefined;
    mockFormState.view = 'form';
    document.title = '';
  });

  it('renders chrome, the h1, the swap link, and the page title (AC1-AC3)', async () => {
    renderWithProviders(<SignUp />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Registration' })
    ).toBeInTheDocument();
    expect(screen.getByTestId('auth-shell-header')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByTestId('auth-shell-footer')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: 'Already have an account?' });
    expect(link).toHaveAttribute('href', '/sign-in');
    expect(document.title).toBe('Registration - VilnaCRM');
  });

  it('marks the OAuth row inert once the registration view leaves the form (AC5)', () => {
    renderWithProviders(<SignUpFormSection />);

    const oauthRow = (): HTMLElement => screen.getByTestId('auth-provider-buttons-container');
    expect(oauthRow()).toHaveAttribute('data-inert', 'false');

    act(() => capturedOnViewChange?.('success'));

    expect(oauthRow()).toHaveAttribute('data-inert', 'true');
  });
});
