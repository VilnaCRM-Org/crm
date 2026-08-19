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

const formState: FormState = {
  view: 'form',
  errorText: '',
  formKey: 7,
  isSubmitting: false,
  showSubmitLoader: false,
  handleRegister: jest.fn(),
  handleSuccessShown: jest.fn(),
  handleBackToForm: jest.fn(),
  handleRetry: jest.fn(),
};

const mockUIForm = jest.fn();
const mockInertBox = jest.fn();

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
    load: (): Promise<{ default: () => ReactElement }> =>
      Promise.resolve({ default: (): ReactElement => <p>notification</p> }),
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

jest.mock('@/components/ui-form', () => ({
  __esModule: true,
  default: (props: { children: ReactNode }): ReactElement => {
    mockUIForm(props);
    return <form>{props.children}</form>;
  },
}));

jest.mock('@auth/components/form-section/inert-box', () => ({
  __esModule: true,
  default: (props: { id: string; inert: boolean; children: ReactNode }): ReactElement => {
    mockInertBox(props);
    return <div id={props.id}>{props.children}</div>;
  },
}));

jest.mock('@auth/components/form-section/auth-forms/registration-form-fields', () => ({
  __esModule: true,
  default: (): ReactElement => <div />,
}));

function lastInertBoxProps(): { id: string; inert: boolean } {
  const calls = mockInertBox.mock.calls;
  return calls[calls.length - 1][0] as { id: string; inert: boolean };
}

describe('RegistrationForm panel wiring', () => {
  beforeEach(() => {
    formState.view = 'form';
    formState.formKey = 7;
  });

  it('derives the form container id from the current form key', () => {
    render(<RegistrationForm />);

    expect(lastInertBoxProps().id).toBe('reg-form-7');
  });

  it('changes the form container id when the form key is bumped', () => {
    formState.formKey = 8;

    render(<RegistrationForm />);

    expect(lastInertBoxProps().id).toBe('reg-form-8');
  });

  it('keeps the submit button enabled while the form view is active', () => {
    render(<RegistrationForm />);

    expect(mockUIForm).toHaveBeenCalledWith(expect.objectContaining({ isSubmitDisabled: false }));
    expect(lastInertBoxProps().inert).toBe(false);
  });

  it('disables the submit button once the notification view takes over', async () => {
    formState.view = 'error';

    render(<RegistrationForm />);

    expect(mockUIForm).toHaveBeenCalledWith(expect.objectContaining({ isSubmitDisabled: true }));
    expect(lastInertBoxProps().inert).toBe(true);
    expect(await screen.findByText('notification')).toBeInTheDocument();
  });

  it('passes the sign-up title and subtitle keys to the shared form', () => {
    render(<RegistrationForm />);

    expect(mockUIForm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'sign_up.title',
        titleComponent: 'h1',
        subtitle: 'sign_up.subtitle',
      })
    );
  });

  it('never reuses the title string as the subtitle', () => {
    render(<RegistrationForm />);

    const props = mockUIForm.mock.calls[0][0] as { title: string; subtitle: string };

    expect(props.title).not.toBe(props.subtitle);
    expect(props.title).not.toBe('');
    expect(props.subtitle).not.toBe('');
  });
});
