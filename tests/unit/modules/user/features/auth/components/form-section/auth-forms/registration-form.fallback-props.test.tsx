import { render, screen } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import type { RouteFallbackProps } from '@/components/types/route-fallback';
import RegistrationForm from '@auth/components/form-section/auth-forms/registration-form';

type FormState = {
  view: 'form' | 'success' | 'error';
  errorText: string;
  formKey: number;
  isSubmitting: boolean;
  showSubmitLoader: boolean;
  handleRegister: jest.Mock;
  handleSuccessShown: jest.Mock;
  handleBackToForm: jest.Mock;
  handleRetry: jest.Mock;
};

const formState: FormState = {
  view: 'error',
  errorText: 'failed',
  formKey: 1,
  isSubmitting: false,
  showSubmitLoader: false,
  handleRegister: jest.fn(),
  handleSuccessShown: jest.fn(),
  handleBackToForm: jest.fn(),
  handleRetry: jest.fn(),
};

const mockRouteFallback = jest.fn();

jest.mock('@auth/hooks/use-registration-form', () => ({
  __esModule: true,
  default: (): FormState => formState,
}));

jest.mock('@auth/components/form-section/validations', () => ({
  __esModule: true,
  default: { create: (): Record<string, never> => ({}) },
}));

jest.mock('@auth/utils/load-registration-notification', () => ({
  __esModule: true,
  default: {
    load: (): Promise<never> =>
      new Promise<never>(() => {
        // never resolves, so the suspense fallback stays mounted
      }),
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

jest.mock('@/components/route-fallback', () => ({
  __esModule: true,
  default: (props: RouteFallbackProps): ReactElement => {
    mockRouteFallback(props);
    return <div role="status">{props.message}</div>;
  },
}));

jest.mock('@/components/ui-form', () => ({
  __esModule: true,
  default: (props: { children: ReactNode }): ReactElement => <form>{props.children}</form>,
}));

jest.mock('@auth/components/form-section/inert-box', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }): ReactElement => <div>{children}</div>,
}));

jest.mock('@auth/components/form-section/auth-forms/registration-form-fields', () => ({
  __esModule: true,
  default: (): ReactElement => <div />,
}));

describe('RegistrationForm suspense fallback wiring', () => {
  beforeEach(() => {
    mockRouteFallback.mockClear();
    formState.view = 'error';
  });

  it('renders the shared RouteFallback in flow with the sign-up loading copy', () => {
    render(<RegistrationForm />);

    expect(mockRouteFallback).toHaveBeenCalledWith({
      minHeight: 'auto',
      message: 'sign_up.form.loading_result',
    });
    expect(screen.getByRole('status')).toHaveTextContent('sign_up.form.loading_result');
  });

  it('mounts no fallback while the form view is active', () => {
    formState.view = 'form';

    render(<RegistrationForm />);

    expect(mockRouteFallback).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
