import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ButtonHTMLAttributes, ReactElement } from 'react';

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
    onMouseEnter,
    onFocus,
    onTouchStart,
  }: {
    children: ReactElement | string;
  } & ButtonHTMLAttributes<HTMLButtonElement>): ReactElement => (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      onTouchStart={onTouchStart}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/modules/user/features/auth/components/form-section/auth-forms/login-form', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="login-form" />,
}));

jest.mock('@/modules/user/features/auth/components/form-section/auth-forms/registration-form', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="registration-form" />,
}));

jest.mock('@/modules/user/features/auth/components/form-section/components/auth-provider-buttons', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="auth-provider-buttons" />,
}));

describe('FormSection', () => {
  it('renders the primary form and social providers immediately', () => {
    render(<FormSection />);

    expect(screen.getByTestId('registration-form')).toBeInTheDocument();
    expect(screen.getByTestId('auth-provider-buttons')).toBeInTheDocument();
  });

  it('keeps the current form visible across rerenders', async () => {
    const { rerender } = render(<FormSection />);

    expect(screen.getByTestId('registration-form')).toBeInTheDocument();
    expect(screen.getByTestId('auth-provider-buttons')).toBeInTheDocument();

    rerender(<FormSection />);

    await waitFor(() => {
      expect(screen.getByTestId('registration-form')).toBeInTheDocument();
    });

    expect(screen.getByTestId('auth-provider-buttons')).toBeInTheDocument();
  });

  it('switches to login mode when the switcher button is clicked', async () => {
    render(<FormSection />);

    expect(screen.getByTestId('registration-form')).toBeInTheDocument();

    fireEvent.click(screen.getByText('sign_up.form.switcher_text_have_account'));

    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('registration-form')).not.toBeInTheDocument();
    expect(screen.getByText('sign_up.form.switcher_text_no_account')).toBeInTheDocument();
  });

  it('toggles back to registration mode on a second click', async () => {
    render(<FormSection />);

    fireEvent.click(screen.getByText('sign_up.form.switcher_text_have_account'));

    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('sign_up.form.switcher_text_no_account'));

    expect(screen.getByTestId('registration-form')).toBeInTheDocument();
    expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
  });
});
