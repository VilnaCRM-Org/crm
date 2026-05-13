import { render, screen } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import RegistrationForm from '@/modules/user/features/auth/components/form-section/auth-forms/registration-form';

type FormState = {
  view: 'form' | 'success' | 'error';
  errorText: string;
  formKey: number;
  isSubmitting: boolean;
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
  handleRegister: jest.fn(),
  handleSuccessShown: jest.fn(),
  handleBackToForm: jest.fn(),
  handleRetry: jest.fn(),
};

jest.mock('@auth/hooks/use-registration-form', () => ({
  __esModule: true,
  default: (): FormState => mockFormState,
}));

jest.mock('@auth/components/form-section/validations', () => ({
  createValidators: (): Record<string, never> => ({}),
}));

jest.mock('@auth/utils/get-submit-label-key', () => ({
  __esModule: true,
  default: (): string => 'sign_up.submit',
}));

jest.mock('@auth/utils/load-registration-notification', () => ({
  __esModule: true,
  default: (): Promise<{ default: () => ReactElement }> =>
    Promise.resolve({ default: (): ReactElement => <div data-testid="reg-notification" /> }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

jest.mock('@/components/ui-form', () => ({
  __esModule: true,
  default: ({
    children,
    isSubmitDisabled,
    isSubmitting,
  }: {
    children: ReactNode;
    isSubmitDisabled?: boolean;
    isSubmitting?: boolean;
  }): ReactElement => (
    <form
      data-testid="ui-form"
      data-disabled={String(Boolean(isSubmitDisabled))}
      data-submitting={String(Boolean(isSubmitting))}
    >
      {children}
    </form>
  ),
}));

jest.mock('@auth/components/form-section/inert-box', () => ({
  __esModule: true,
  default: ({ children, inert }: { children: ReactNode; inert?: boolean }): ReactElement => (
    <div data-testid="inert-box" data-inert={String(Boolean(inert))}>
      {children}
    </div>
  ),
}));

jest.mock('@auth/components/form-section/auth-forms/registration-form-fields', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="form-fields" />,
}));

describe('RegistrationForm', () => {
  beforeEach(() => {
    mockFormState.view = 'form';
    mockFormState.errorText = '';
    mockFormState.isSubmitting = false;
    mockFormState.formKey = 0;
  });

  it('renders the form panel and no notification when on form view', () => {
    render(<RegistrationForm />);

    expect(screen.getByTestId('ui-form')).toBeInTheDocument();
    expect(screen.getByTestId('form-fields')).toBeInTheDocument();
    expect(screen.queryByTestId('reg-notification')).not.toBeInTheDocument();
    expect(screen.getByTestId('inert-box')).toHaveAttribute('data-inert', 'false');
  });

  it('marks the inert box as inert, disables submit, and shows the notification when not on form view', async () => {
    mockFormState.view = 'success';

    render(<RegistrationForm />);

    expect(screen.getByTestId('ui-form')).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByTestId('inert-box')).toHaveAttribute('data-inert', 'true');
    expect(await screen.findByTestId('reg-notification')).toBeInTheDocument();
  });

  it('passes the submitting flag through to the form', () => {
    mockFormState.isSubmitting = true;

    render(<RegistrationForm />);

    expect(screen.getByTestId('ui-form')).toHaveAttribute('data-submitting', 'true');
  });
});
