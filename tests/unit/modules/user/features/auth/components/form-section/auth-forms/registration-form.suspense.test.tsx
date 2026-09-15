import { act, render, screen } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import RegistrationForm from '@auth/components/form-section/auth-forms/registration-form';

const ANNOUNCE_DELAY_MS = 150;
const LOADING_RESULT_KEY = 'sign_up.form.loading_result';
const NOTIFICATION_TEXT = 'registration notification';

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
  view: 'success',
  errorText: '',
  formKey: 1,
  isSubmitting: false,
  showSubmitLoader: false,
  handleRegister: jest.fn(),
  handleSuccessShown: jest.fn(),
  handleBackToForm: jest.fn(),
  handleRetry: jest.fn(),
};

type NotificationModule = { default: () => ReactElement };

let resolveNotification: (module: NotificationModule) => void = () => undefined;

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
    load: (): Promise<NotificationModule> =>
      new Promise<NotificationModule>((resolve) => {
        resolveNotification = resolve;
      }),
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
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

describe('RegistrationForm notification suspense fallback', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('announces the localized loading copy only after the deferred-paint window', () => {
    render(<RegistrationForm />);

    const status = screen.getByRole('status');
    expect(status).toBeEmptyDOMElement();

    act(() => {
      jest.advanceTimersByTime(ANNOUNCE_DELAY_MS);
    });

    expect(status).toHaveTextContent(LOADING_RESULT_KEY);
    expect(status).not.toHaveTextContent('route_fallback.loading');
  });

  it('swaps the fallback for the notification once its chunk resolves', async () => {
    render(<RegistrationForm />);

    act(() => {
      jest.advanceTimersByTime(ANNOUNCE_DELAY_MS);
    });
    expect(screen.getByRole('status')).toHaveTextContent(LOADING_RESULT_KEY);

    await act(async () => {
      resolveNotification({ default: (): ReactElement => <p>{NOTIFICATION_TEXT}</p> });
    });

    expect(await screen.findByText(NOTIFICATION_TEXT)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
