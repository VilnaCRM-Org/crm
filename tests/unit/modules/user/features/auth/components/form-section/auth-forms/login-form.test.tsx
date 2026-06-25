import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';

import LoginForm, {
  LoginErrorMessageNormalizer,
} from '@auth/components/form-section/auth-forms/login-form';
import { buildCredentials } from '@tests/builders';

const normalizeLoginErrorMessage = (error: unknown): string =>
  new LoginErrorMessageNormalizer().normalize(error);

const submitCredentials = buildCredentials();

const mockLoginUser = jest.fn();
const mockFormField = jest.fn();
const mockUIForm = jest.fn();

function makeSubmitHandler(
  onSubmit: (data: { email: string; password: string }) => Promise<void>
): () => void {
  return (): void => {
    void onSubmit({ ...submitCredentials });
  };
}

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string, options?: Record<string, unknown>) => string } => ({
    t: (key: string, options?: Record<string, unknown>): string => {
      if (options?.reason !== undefined) return `${key}: ${String(options.reason)}`;
      return key;
    },
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
  loginUser: (...args: unknown[]) => unknown;
} = {
  loginError: null,
  loginLoading: false,
  loginUser: mockLoginUser,
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

jest.mock('@auth/components/form-section/components/form-field', () => ({
  __esModule: true,
  default: (props: {
    label: string;
    placeholder: string;
    rules: { required: string };
  }): ReactElement => {
    mockFormField(props);
    return <div data-testid="form-field" />;
  },
}));

jest.mock('@auth/components/form-section/components/password-field', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="password-field" />,
}));

jest.mock('@auth/components/form-section/components/user-options', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="user-options" />,
}));

jest.mock('@/components/ui-form', () => ({
  __esModule: true,
  default: (props: {
    error: string;
    isSubmitting: boolean;
    onSubmit: (data: { email: string; password: string }) => Promise<void>;
    children: ReactElement[];
    titleComponent?: string;
  }): ReactElement => {
    mockUIForm(props);

    return (
      <div>
        <button type="button" onClick={makeSubmitHandler(props.onSubmit)}>
          submit
        </button>
        <div data-testid="form-error">{props.error}</div>
        {props.children}
      </div>
    );
  },
}));

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authStoreState.loginError = null;
    authStoreState.loginLoading = false;
    mockLoginUser.mockReset();
  });

  it('uses sign-in translations for the email field', () => {
    render(<LoginForm />);

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

  it('passes the stable submit and submitting labels to the form', () => {
    render(<LoginForm />);

    expect(mockUIForm).toHaveBeenCalledWith(
      expect.objectContaining({
        submitLabel: 'sign_in.form.submit_button',
        submittingLabel: 'sign_in.form.submitting',
      })
    );
  });

  it('renders the login title as a real <h1> via titleComponent (AC2)', () => {
    render(<LoginForm />);

    expect(mockUIForm).toHaveBeenCalledWith(expect.objectContaining({ titleComponent: 'h1' }));
  });

  it('invokes the loginUser action when the form is submitted', async () => {
    mockLoginUser.mockResolvedValue(undefined);

    render(<LoginForm />);
    fireEvent.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() => {
      expect(mockLoginUser).toHaveBeenCalledWith(submitCredentials, expect.any(AbortSignal));
    });
  });

  it('shows a translated login error prefix when the store has a login error', () => {
    authStoreState.loginError = {
      kind: 'authentication',
      displayMessage: 'Invalid credentials',
      retryable: false,
    };

    render(<LoginForm />);

    expect(screen.getByTestId('form-error')).toHaveTextContent(
      'sign_in.errors.login: Invalid credentials'
    );
  });

  it('shows nothing when the store has no login error', () => {
    render(<LoginForm />);

    expect(screen.getByTestId('form-error')).toHaveTextContent('');
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

describe('normalizeLoginErrorMessage', () => {
  it('returns a direct string error when it is non-empty', () => {
    expect(normalizeLoginErrorMessage('Invalid credentials')).toBe('Invalid credentials');
  });

  it('returns a trimmed direct string error when it contains surrounding whitespace', () => {
    expect(normalizeLoginErrorMessage('  Invalid credentials  ')).toBe('Invalid credentials');
  });

  it('returns an Error message when the error is an Error instance', () => {
    expect(normalizeLoginErrorMessage(new Error('Invalid credentials'))).toBe(
      'Invalid credentials'
    );
  });

  it('returns the unknown translation key when an Error message is blank', () => {
    expect(normalizeLoginErrorMessage(new Error('   '))).toBe('auth.errors.unknown');
  });

  it('uses displayMessage when a blank Error message is present', () => {
    const error = Object.assign(new Error('   '), {
      displayMessage: 'Display message object',
    });

    expect(normalizeLoginErrorMessage(error)).toBe('Display message object');
  });

  it('uses data.message when a blank Error message is present', () => {
    const error = Object.assign(new Error('   '), {
      data: { message: 'Invalid credentials' },
    });

    expect(normalizeLoginErrorMessage(error)).toBe('Invalid credentials');
  });

  it('falls back to the unknown translation key for non-record values', () => {
    expect(normalizeLoginErrorMessage(404)).toBe('auth.errors.unknown');
  });

  it('returns the serialized error message when available', () => {
    expect(normalizeLoginErrorMessage({ message: 'Serialized credentials error' })).toBe(
      'Serialized credentials error'
    );
  });

  it('returns the nested message field when error.message is an object', () => {
    expect(
      normalizeLoginErrorMessage({
        message: { message: 'Nested message object' },
      })
    ).toBe('Nested message object');
  });

  it('returns the nested displayMessage field when available', () => {
    expect(
      normalizeLoginErrorMessage({
        displayMessage: { message: 'Display message object' },
      })
    ).toBe('Display message object');
  });

  it('returns a direct nested displayMessage string when available', () => {
    expect(
      normalizeLoginErrorMessage({
        displayMessage: 'Display message string',
      })
    ).toBe('Display message string');
  });

  it('skips blank string nested messages and continues to later fallbacks', () => {
    expect(
      normalizeLoginErrorMessage({
        message: '   ',
        data: { message: 'Data fallback after blank message' },
      })
    ).toBe('Data fallback after blank message');
  });

  it('returns the nested data.message value when available', () => {
    expect(normalizeLoginErrorMessage({ data: { message: 'Invalid credentials' } })).toBe(
      'Invalid credentials'
    );
  });

  it('falls back to the unknown translation key when no message can be found', () => {
    expect(normalizeLoginErrorMessage({ data: {} })).toBe('auth.errors.unknown');
  });
});
