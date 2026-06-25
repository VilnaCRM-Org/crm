import { render, screen } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

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

jest.mock('@auth/hooks/use-registration-form', () => ({
  __esModule: true,
  default: (): FormState => mockFormState,
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

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

const mockUIForm = jest.fn();

jest.mock('@/components/ui-form', () => ({
  __esModule: true,
  default: (props: {
    children: ReactNode;
    isSubmitDisabled?: boolean;
    isSubmitting?: boolean;
    submittingAnnouncement?: boolean;
    submitLabel?: string;
    submittingLabel?: string;
    titleComponent?: string;
  }): ReactElement => {
    mockUIForm(props);
    return (
      <form
        data-testid="ui-form"
        data-disabled={String(Boolean(props.isSubmitDisabled))}
        data-submitting={String(Boolean(props.isSubmitting))}
        data-announce={String(Boolean(props.submittingAnnouncement))}
      >
        {props.children}
      </form>
    );
  },
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
    mockUIForm.mockClear();
    mockFormState.view = 'form';
    mockFormState.errorText = '';
    mockFormState.isSubmitting = false;
    mockFormState.showSubmitLoader = false;
    mockFormState.formKey = 0;
  });

  it('passes the stable submit and submitting labels to the form', () => {
    render(<RegistrationForm />);

    expect(mockUIForm).toHaveBeenCalledWith(
      expect.objectContaining({
        submitLabel: 'sign_up.form.submit_button',
        submittingLabel: 'sign_up.form.submitting',
      })
    );
  });

  it('renders the form title as a real <h1> via titleComponent (AC2)', () => {
    render(<RegistrationForm />);

    expect(mockUIForm).toHaveBeenCalledWith(expect.objectContaining({ titleComponent: 'h1' }));
  });

  it('renders the form panel and no notification when on form view', () => {
    render(<RegistrationForm />);

    expect(screen.getByTestId('ui-form')).toBeInTheDocument();
    expect(screen.getByTestId('form-fields')).toBeInTheDocument();
    expect(screen.queryByTestId('reg-notification')).not.toBeInTheDocument();
    expect(screen.getByTestId('inert-box')).toHaveAttribute('data-inert', 'false');
  });

  it('disables submit and shows the notification when not on form view', async () => {
    mockFormState.view = 'success';

    render(<RegistrationForm />);

    expect(screen.getByTestId('ui-form')).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByTestId('inert-box')).toHaveAttribute('data-inert', 'true');
    expect(await screen.findByTestId('reg-notification')).toBeInTheDocument();
  });

  it('drives the visual submit loader from showSubmitLoader', () => {
    mockFormState.isSubmitting = false;
    mockFormState.showSubmitLoader = true;

    render(<RegistrationForm />);

    expect(screen.getByTestId('ui-form')).toHaveAttribute('data-submitting', 'true');
  });

  it('announces submitting only while the request is in flight', () => {
    mockFormState.isSubmitting = true;
    mockFormState.showSubmitLoader = true;

    render(<RegistrationForm />);

    expect(screen.getByTestId('ui-form')).toHaveAttribute('data-announce', 'true');
  });

  it('keeps the loader visible but stops announcing once a result arrives', () => {
    mockFormState.isSubmitting = false;
    mockFormState.showSubmitLoader = true;

    render(<RegistrationForm />);

    const form = screen.getByTestId('ui-form');
    expect(form).toHaveAttribute('data-submitting', 'true');
    expect(form).toHaveAttribute('data-announce', 'false');
  });
});
