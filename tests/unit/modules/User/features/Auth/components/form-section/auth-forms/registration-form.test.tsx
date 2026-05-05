import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import RegistrationForm from '@/modules/User/features/Auth/components/form-section/auth-forms/registration-form';

type MockHookResult = {
  view: 'form' | 'error' | 'success';
  errorText: string;
  formKey: number;
  isSubmitting: boolean;
  handleRegister: () => void;
  handleSuccessShown: () => void;
  handleBackToForm: () => void;
  handleRetry: jest.Mock;
};

const loadRegistrationNotificationMock = jest.fn();
let staticHookResult: MockHookResult | null = null;

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

jest.mock('@/components/ui-button', () => ({
  __esModule: true,
  default: ({
    children,
    disabled,
    onClick,
    type = 'button',
  }: {
    children: JSX.Element | string;
    disabled?: boolean;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
  }): JSX.Element => (
    <button type={type === 'submit' ? 'submit' : 'button'} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui-typography', () => ({
  __esModule: true,
  default: ({
    children,
    component,
    htmlFor,
    role,
  }: {
    children: JSX.Element | string;
    component?: keyof JSX.IntrinsicElements;
    htmlFor?: string;
    role?: string;
  }): JSX.Element => {
    const Component = component ?? 'span';
    return (
      <Component htmlFor={htmlFor} role={role}>
        {children}
      </Component>
    );
  },
}));

jest.mock('@/modules/User/features/Auth/components/form-section/components/form-field', () => ({
  __esModule: true,
  default: function MockFormField({
    name,
    placeholder,
    type,
  }: {
    name: string;
    placeholder: string;
    type: string;
  }): JSX.Element {
    const { useFormContext } = jest.requireActual(
      'react-hook-form'
    ) as typeof import('react-hook-form');
    const { register } = useFormContext();
    const registration = register(name);

    return (
      <input
        ref={registration.ref}
        name={registration.name}
        onBlur={registration.onBlur}
        onChange={registration.onChange}
        placeholder={placeholder}
        type={type}
      />
    );
  },
}));

jest.mock('@/modules/User/features/Auth/components/form-section/components/password-field', () => ({
  __esModule: true,
  default: function MockPasswordField({ placeholder }: { placeholder: string }): JSX.Element {
    const { useFormContext } = jest.requireActual(
      'react-hook-form'
    ) as typeof import('react-hook-form');
    const { register } = useFormContext();
    const registration = register('password');

    return (
      <input
        ref={registration.ref}
        name={registration.name}
        onBlur={registration.onBlur}
        onChange={registration.onChange}
        placeholder={placeholder}
        type="password"
      />
    );
  },
}));

jest.mock('@/modules/User/features/Auth/utils/load-registration-notification', () => ({
  __esModule: true,
  default: (): ReturnType<typeof loadRegistrationNotificationMock> =>
    loadRegistrationNotificationMock(),
}));

jest.mock('@/modules/User/features/Auth/hooks/use-registration-form', () => ({
  __esModule: true,
  default: function useMockRegistrationForm(): {
    view: 'form' | 'error' | 'success';
    errorText: string;
    formKey: number;
    isSubmitting: boolean;
    handleRegister: () => void;
    handleSuccessShown: () => void;
    handleBackToForm: () => void;
    handleRetry: jest.Mock;
  } {
    const { useCallback, useState } = jest.requireActual('react') as typeof import('react');
    const [view, setView] = useState<'form' | 'error'>('form');
    const handleRegister = useCallback(() => {
      setView('error');
    }, []);
    const handleBackToForm = useCallback(() => {
      setView('form');
    }, []);

    if (staticHookResult) {
      return staticHookResult;
    }

    return {
      view,
      errorText: 'Request failed',
      formKey: 0,
      isSubmitting: false,
      handleRegister,
      handleSuccessShown: jest.fn(),
      handleBackToForm,
      handleRetry: jest.fn(),
    };
  },
}));

describe('RegistrationForm', () => {
  beforeEach(() => {
    staticHookResult = null;
    loadRegistrationNotificationMock.mockReset();
    loadRegistrationNotificationMock.mockResolvedValue({
      default: ({ onBack }: { onBack: () => void }): JSX.Element => (
        <button type="button" onClick={onBack}>
          back-to-form
        </button>
      ),
    });
  });

  it('preserves the entered values when returning from the error notification', async () => {
    render(<RegistrationForm />);

    const fullNameInput = screen.getByPlaceholderText('sign_up.form.name_input.placeholder');
    const emailInput = screen.getByPlaceholderText('sign_up.form.email_input.placeholder');
    const passwordInput = screen.getByPlaceholderText('sign_up.form.password_input.placeholder');

    fireEvent.change(fullNameInput, { target: { value: 'Ada Lovelace' } });
    fireEvent.change(emailInput, { target: { value: 'ada@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password1!' } });

    fireEvent.click(screen.getByRole('button', { name: 'sign_up.form.submit_button' }));

    fireEvent.click(await screen.findByRole('button', { name: 'back-to-form' }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'back-to-form' })).not.toBeInTheDocument();
    });

    expect(fullNameInput).toHaveValue('Ada Lovelace');
    expect(emailInput).toHaveValue('ada@example.com');
    expect(passwordInput).toHaveValue('Password1!');
  });

  it('keeps the submit button disabled while the success notification is still loading', () => {
    staticHookResult = {
      view: 'success',
      errorText: '',
      formKey: 1,
      isSubmitting: false,
      handleRegister: jest.fn(),
      handleSuccessShown: jest.fn(),
      handleBackToForm: jest.fn(),
      handleRetry: jest.fn(),
    };
    loadRegistrationNotificationMock.mockReturnValue(new Promise(() => {}));

    render(<RegistrationForm />);

    expect(screen.getByRole('button', { name: 'sign_up.form.submit_button' })).toBeDisabled();
  });
});
