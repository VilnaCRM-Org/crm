import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';

import LoginForm, {
  normalizeLoginErrorMessage,
} from '@/modules/User/features/Auth/components/form-section/auth-forms/login-form';

const mockDispatch = jest.fn();
const mockLoginUser = jest.fn();
const mockFormField = jest.fn();
const mockUIForm = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string, options?: Record<string, unknown>) => string } => ({
    t: (key: string, options?: Record<string, unknown>): string => {
      if (options?.reason !== undefined) return `${key}: ${String(options.reason)}`;
      return key;
    },
  }),
}));

jest.mock('@/stores/hooks', () => ({
  __esModule: true,
  default: (): typeof mockDispatch => mockDispatch,
}));

jest.mock('@/modules/User/store', () => ({
  loginUser: (...args: unknown[]): unknown => mockLoginUser(...args),
}));

jest.mock('@/modules/User/features/Auth/utils/getSubmitLabelKey', () => ({
  __esModule: true,
  default: (mode: string, isSubmitting: boolean): string =>
    `${mode}.${isSubmitting ? 'submitting' : 'submit_button'}`,
}));

jest.mock('@/modules/User/features/Auth/components/form-section/components/form-field', () => ({
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

jest.mock('@/modules/User/features/Auth/components/form-section/components/password-field', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="password-field" />,
}));

jest.mock('@/modules/User/features/Auth/components/form-section/components/user-options', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="user-options" />,
}));

jest.mock('@/components/UIForm', () => ({
  __esModule: true,
  default: (props: {
    error: string;
    onSubmit: (data: { email: string; password: string }) => Promise<void>;
    children: ReactElement[];
  }): ReactElement => {
    mockUIForm(props);

    return (
      <div>
        <button
          type="button"
          onClick={() => props.onSubmit({ email: 'user@example.com', password: 'secret123' })}
        >
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
    mockLoginUser.mockImplementation((payload: unknown) => payload);
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

  it('shows a translated login error prefix with a normalized message', async () => {
    mockDispatch.mockReturnValue({
      unwrap: () => Promise.reject(new Error('Invalid credentials')),
    });

    render(<LoginForm />);
    fireEvent.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() => {
      expect(screen.getByTestId('form-error')).toHaveTextContent(
        'sign_in.errors.login: Invalid credentials'
      );
    });
  });

  it('translates the error reason when it matches an i18n key pattern', async () => {
    mockDispatch.mockReturnValue({
      unwrap: () => Promise.reject(new Error('')),
    });

    render(<LoginForm />);
    fireEvent.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() => {
      expect(screen.getByTestId('form-error')).toHaveTextContent(
        'sign_in.errors.login: auth.errors.unknown'
      );
    });
  });

  it('ignores serialized abort-shaped rejections from unwrap', async () => {
    mockDispatch.mockReturnValue({
      unwrap: () => Promise.reject({ name: 'AbortError', message: 'The operation was aborted' }),
    });

    render(<LoginForm />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'submit' }));
      await Promise.resolve();
    });

    expect(screen.getByTestId('form-error')).toHaveTextContent('');
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
