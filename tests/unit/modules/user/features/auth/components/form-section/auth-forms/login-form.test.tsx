import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import type { ReactElement, ReactNode } from 'react';
import * as ReactHookForm from 'react-hook-form';
import { useForm } from 'react-hook-form';

import FormProviderBridge from '@/components/ui-form/form-provider-bridge';
import LoginForm from '@auth/components/form-section/auth-forms/login-form';
import type { PostLoginRedirect } from '@auth/types/sign-in/post-login-redirect';
import { buildCredentials } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';

const submitCredentials = buildCredentials();

const mockLoginUser = jest.fn();
const mockFormField = jest.fn();
const mockUIForm = jest.fn();
const mockNotification = jest.fn();
const mockLoad = jest.fn();
const mockSetFocus = jest.fn();
const mockPrefetch = jest.fn();

function makeSubmitHandler(
  onSubmit: (data: { email: string; password: string }) => Promise<void>
): () => void {
  return (): void => {
    void onSubmit({ ...submitCredentials });
  };
}

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

interface AuthError {
  kind: string;
  displayMessage: string;
  retryable: boolean;
}

const authStoreState: {
  loginError: AuthError | null;
  loginLoading: boolean;
} = {
  loginError: null,
  loginLoading: false,
};

jest.mock('@auth/stores', () => ({
  __esModule: true,
  useAuthState: (): typeof authStoreState => authStoreState,
  authActions: {
    loginUser: (...args: unknown[]): unknown => mockLoginUser(...args),
    clearLoginError: (): void => {
      authStoreState.loginError = null;
    },
  },
  AuthStoreSelectors: {
    loginError: (state: typeof authStoreState): AuthError | null => state.loginError,
    loginLoading: (state: typeof authStoreState): boolean => state.loginLoading,
  },
}));

interface StubNotificationProps {
  view: string;
  flow: string;
  errorText: string;
  onBack: () => void;
  onRetry: () => void;
}

function StubNotification(props: StubNotificationProps): ReactElement {
  mockNotification(props);
  return (
    <section aria-label={`notification ${props.view}`}>
      <p>{props.errorText}</p>
      <button type="button" onClick={props.onBack}>
        notification back
      </button>
      <button type="button" onClick={props.onRetry}>
        notification retry
      </button>
    </section>
  );
}

jest.mock('@auth/utils/load-registration-notification', () => ({
  __esModule: true,
  default: { load: (): unknown => mockLoad() },
  registrationNotificationPrefetcher: { prefetch: (): unknown => mockPrefetch() },
}));

jest.mock('@auth/components/form-section/components/form-field', () => ({
  __esModule: true,
  default: (props: {
    label: string;
    placeholder: string;
    rules: { required: string };
  }): ReactElement => {
    mockFormField(props);
    return <div>form field</div>;
  },
}));

jest.mock('@/components/route-fallback', () => ({
  __esModule: true,
  default: ({ message }: { message: string }): ReactElement => <p role="status">{message}</p>,
}));

jest.mock('@auth/components/form-section/inert-box', () =>
  jest.requireActual('@tests/unit/utils/inert-box-stub')
);

jest.mock('@auth/components/form-section/components/password-field', () => ({
  __esModule: true,
  default: (): ReactElement => <div>password field</div>,
}));

jest.mock('@auth/components/form-section/components/user-options', () => ({
  __esModule: true,
  default: (): ReactElement => <div>user options</div>,
}));

function FormContext({ children }: { children: ReactNode }): ReactElement {
  const methods = useForm();
  return (
    <FormProviderBridge methods={{ ...methods, setFocus: mockSetFocus }}>
      {children}
    </FormProviderBridge>
  );
}

jest.mock('@/components/ui-form', () => ({
  __esModule: true,
  default: (props: {
    error: string | null;
    onSubmit: (data: { email: string; password: string }) => Promise<void>;
    children: ReactNode;
  }): ReactElement => {
    mockUIForm(props);
    return (
      <FormContext>
        <button type="button" onClick={makeSubmitHandler(props.onSubmit)}>
          submit
        </button>
        {props.children}
      </FormContext>
    );
  },
}));

const signedOut = (): PostLoginRedirect => ({ signedIn: false, proceed: jest.fn() });

const lastUIFormProps = (): Record<string, unknown> =>
  mockUIForm.mock.calls[mockUIForm.mock.calls.length - 1]?.[0] as Record<string, unknown>;

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authStoreState.loginError = null;
    authStoreState.loginLoading = false;
    mockLoginUser.mockReset().mockResolvedValue(undefined);
    mockLoad.mockReset().mockResolvedValue({ default: StubNotification });
  });

  it('uses sign-in translations for the email field', () => {
    render(<LoginForm postLogin={signedOut()} />);

    expect(mockFormField).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'sign_in.form.email_input.label',
        placeholder: 'sign_in.form.email_input.placeholder',
        rules: expect.objectContaining({
          required: 'sign_in.form.email_input.required',
        }),
      })
    );
  });

  it('passes the labels, never a banner error, and an open form', () => {
    render(<LoginForm postLogin={signedOut()} />);

    expect(lastUIFormProps()).toEqual(
      expect.objectContaining({
        submitLabel: 'sign_in.form.submit_button',
        submittingLabel: 'sign_in.form.submitting',
        error: null,
        isSubmitDisabled: false,
      })
    );
    expect(screen.queryByRole('region', { name: /notification/ })).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'login-form inert=false' })).toBeInTheDocument();
  });

  it('seeds the form with empty credentials when the module loads inside the test', async () => {
    const FreshLoginForm = await loadIsolated(async () => {
      jest.doMock('react', () => React);
      jest.doMock('react-hook-form', () => ReactHookForm);
      return (await import('@auth/components/form-section/auth-forms/login-form')).default;
    });

    render(<FreshLoginForm postLogin={signedOut()} />);

    expect(mockUIForm).toHaveBeenLastCalledWith(
      expect.objectContaining({ defaultValues: { email: '', password: '' } })
    );
  });

  it('announces the sign-in result loading while the card chunk is still on its way', async () => {
    authStoreState.loginError = { kind: 'network', displayMessage: 'offline', retryable: true };
    mockLoad.mockReset().mockReturnValue(new Promise(() => undefined));
    const FreshLoginForm = await loadIsolated(async () => {
      jest.doMock('react', () => React);
      jest.doMock('react-hook-form', () => ReactHookForm);
      return (await import('@auth/components/form-section/auth-forms/login-form')).default;
    });

    render(<FreshLoginForm postLogin={signedOut()} />);

    expect(await screen.findByRole('status')).toHaveTextContent('sign_in.form.loading_result');
    expect(screen.queryByRole('region', { name: /notification/ })).not.toBeInTheDocument();
  });

  it('renders the login title as a real <h1> via titleComponent (AC2)', () => {
    render(<LoginForm postLogin={signedOut()} />);

    expect(mockUIForm).toHaveBeenCalledWith(expect.objectContaining({ titleComponent: 'h1' }));
  });

  it('logs in on submit and starts loading the notification early', async () => {
    render(<LoginForm postLogin={signedOut()} />);
    fireEvent.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() => {
      expect(mockLoginUser).toHaveBeenCalledWith(submitCredentials, expect.any(AbortSignal));
    });
    expect(mockPrefetch).toHaveBeenCalledTimes(1);
  });

  it('shows the sign-in error notification and returns to the form on back', async () => {
    authStoreState.loginError = {
      kind: 'authentication',
      displayMessage: 'Invalid credentials',
      retryable: false,
    };
    const onViewChange = jest.fn();

    render(<LoginForm postLogin={signedOut()} onViewChange={onViewChange} />);

    const card = await screen.findByRole('region', { name: 'notification error' });
    expect(card).toHaveTextContent('sign_in.errors.invalid_credentials');
    expect(card).not.toHaveTextContent('Invalid credentials');
    expect(mockNotification).toHaveBeenLastCalledWith(
      expect.objectContaining({ flow: 'signIn', view: 'error' })
    );
    expect(lastUIFormProps()).toEqual(expect.objectContaining({ isSubmitDisabled: true }));
    expect(screen.getByRole('group', { name: 'login-form inert=true' })).toBeInTheDocument();
    expect(onViewChange).toHaveBeenLastCalledWith('error');
    expect(mockSetFocus).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'notification back' }));

    expect(mockSetFocus).toHaveBeenCalledTimes(1);
    expect(mockSetFocus).toHaveBeenCalledWith('email');

    expect(authStoreState.loginError).toBeNull();
    expect(screen.queryByRole('region', { name: /notification/ })).not.toBeInTheDocument();
    expect(onViewChange).toHaveBeenLastCalledWith('form');
    expect(lastUIFormProps()).toEqual(expect.objectContaining({ isSubmitDisabled: false }));
    expect(screen.getByRole('group', { name: 'login-form inert=false' })).toBeInTheDocument();
  });

  it('retries with the credentials submitted last', async () => {
    const view = render(<LoginForm postLogin={signedOut()} />);
    fireEvent.click(screen.getByRole('button', { name: 'submit' }));
    await waitFor(() => expect(mockLoginUser).toHaveBeenCalledTimes(1));

    authStoreState.loginError = { kind: 'network', displayMessage: 'offline', retryable: true };
    view.rerender(<LoginForm postLogin={signedOut()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'notification retry' }));

    await waitFor(() => expect(mockLoginUser).toHaveBeenCalledTimes(2));
    expect(mockLoginUser).toHaveBeenLastCalledWith(submitCredentials, expect.any(AbortSignal));
  });

  it('shows the success notification after sign-in and proceeds on its button', async () => {
    const postLogin: PostLoginRedirect = { signedIn: true, proceed: jest.fn() };

    render(<LoginForm postLogin={postLogin} />);

    await screen.findByRole('region', { name: 'notification success' });
    expect(screen.getByRole('group', { name: 'login-form inert=true' })).toBeInTheDocument();
    expect(mockNotification).toHaveBeenLastCalledWith(
      expect.objectContaining({ flow: 'signIn', view: 'success' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'notification back' }));
    expect(postLogin.proceed).toHaveBeenCalledTimes(1);
  });

  it('exposes auth form barrel exports', () => {
    jest.isolateModules(() => {
      jest.doMock('@auth/components/form-section/auth-forms/login-form', () => ({
        __esModule: true,
        default: 'LoginForm',
      }));
      jest.doMock('@auth/components/form-section/auth-forms/registration-form', () => ({
        __esModule: true,
        default: 'RegistrationForm',
      }));
      jest.doMock('@auth/components/form-section/auth-forms/registration-form-fields', () => ({
        __esModule: true,
        default: 'RegistrationFormFields',
      }));

      const authForms = jest.requireActual('@auth/components/form-section/auth-forms');
      expect(authForms.LoginForm).toBe('LoginForm');
      expect(authForms.RegistrationForm).toBe('RegistrationForm');
      expect(authForms.RegistrationFormFields).toBe('RegistrationFormFields');

      jest.dontMock('@auth/components/form-section/auth-forms/login-form');
      jest.dontMock('@auth/components/form-section/auth-forms/registration-form');
      jest.dontMock('@auth/components/form-section/auth-forms/registration-form-fields');
    });
  });
});
