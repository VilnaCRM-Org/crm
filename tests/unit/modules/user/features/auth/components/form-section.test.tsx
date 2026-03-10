import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';

import useFontsReady from '@/hooks/use-fonts-ready';
import FormSection from '@/modules/user/features/auth/components/form-section';

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

jest.mock('@/components/ui-button', () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
  }: {
    children: ReactElement | string;
    onClick?: () => void;
  }): ReactElement => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

jest.mock('@/modules/user/features/auth/components/form-section/auth-forms', () => ({
  __esModule: true,
  LoginForm: (): ReactElement => <div data-testid="login-form" />,
  RegistrationForm: (): ReactElement => <div data-testid="registration-form" />,
}));

jest.mock('@/modules/user/features/auth/components/form-section/components/auth-provider-buttons', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="auth-provider-buttons" />,
}));

jest.mock('@/modules/user/features/auth/components/auth-skeleton', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="auth-font-skeleton" />,
}));

jest.mock('@/hooks/use-fonts-ready', () => ({
  __esModule: true,
  default: jest.fn(() => true),
}));

const mockUseFontsReady = useFontsReady as jest.Mock;

describe('FormSection', () => {
  afterEach(() => {
    jest.resetAllMocks();
    mockUseFontsReady.mockReturnValue(true);
  });

  it('renders the primary form and social providers when fonts are ready', () => {
    render(<FormSection />);

    expect(screen.getByTestId('registration-form')).toBeInTheDocument();
    expect(screen.getByTestId('auth-provider-buttons')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-font-skeleton')).not.toBeInTheDocument();
  });

  it('keeps the skeleton visible while fonts are loading', () => {
    mockUseFontsReady.mockReturnValue(false);

    render(<FormSection />);

    expect(screen.getByTestId('auth-font-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('registration-form')).not.toBeInTheDocument();
    expect(screen.queryByTestId('auth-provider-buttons')).not.toBeInTheDocument();
  });

  it('reveals the form and providers once the hook reports fonts ready', async () => {
    mockUseFontsReady.mockReturnValue(false);

    const { rerender } = render(<FormSection />);

    expect(screen.getByTestId('auth-font-skeleton')).toBeInTheDocument();

    mockUseFontsReady.mockReturnValue(true);

    rerender(<FormSection />);

    await waitFor(() => {
      expect(screen.getByTestId('registration-form')).toBeInTheDocument();
    });

    expect(screen.getByTestId('auth-provider-buttons')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-font-skeleton')).not.toBeInTheDocument();
  });

  it('switches to login mode when the switcher button is clicked', () => {
    render(<FormSection />);

    expect(screen.getByTestId('registration-form')).toBeInTheDocument();

    fireEvent.click(screen.getByText('sign_up.form.switcher_text_have_account'));

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.queryByTestId('registration-form')).not.toBeInTheDocument();
    expect(screen.getByText('sign_up.form.switcher_text_no_account')).toBeInTheDocument();
  });

  it('toggles back to registration mode on a second click', () => {
    render(<FormSection />);

    fireEvent.click(screen.getByText('sign_up.form.switcher_text_have_account'));
    fireEvent.click(screen.getByText('sign_up.form.switcher_text_no_account'));

    expect(screen.getByTestId('registration-form')).toBeInTheDocument();
    expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
  });
});
