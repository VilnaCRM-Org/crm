import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';

import localization from '@/i18n/localization.json';
import LoginForm, {
  normalizeLoginErrorMessage,
} from '@/modules/User/features/Auth/components/form-section/auth-forms/login-form';

const mockDispatch = jest.fn();
const mockLoginUser = jest.fn();
const mockFormField = jest.fn();
const mockUIForm = jest.fn();
const enTranslations = localization.en.translation;

function mockTranslate(key: string, options?: Record<string, unknown>): string {
  const value = key.split('.').reduce<unknown>((current, segment) => {
    if (typeof current !== 'object' || current === null) return undefined;
    return (current as Record<string, unknown>)[segment];
  }, enTranslations);

  if (typeof value !== 'string') return key;
  if (options?.reason !== undefined) return value.replace('{{reason}}', String(options.reason));
  return value;
}

function makeSubmitHandler(
  onSubmit: (data: { email: string; password: string }) => Promise<void>
): () => void {
  return (): void => {
    void onSubmit({ email: 'user@example.com', password: 'secret123' });
  };
}

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string, options?: Record<string, unknown>) => string } => ({
    t: mockTranslate,
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
    `${mode}.form.${isSubmitting ? 'submitting' : 'submit_button'}`,
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
    mockLoginUser.mockImplementation((payload: unknown) => payload);
  });

  it('uses sign-in translations for the email field', () => {
    render(<LoginForm />);

    expect(mockFormField).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Email',
        placeholder: 'Enter your email',
        rules: expect.objectContaining({
          required: 'This field is required',
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
        'Sign in error: Invalid credentials'
      );
    });
  });
});

describe('normalizeLoginErrorMessage', () => {
  it('returns a direct string error when it is non-empty', () => {
    expect(normalizeLoginErrorMessage('Invalid credentials')).toBe('Invalid credentials');
  });

  it('returns an Error message when the error is an Error instance', () => {
    expect(normalizeLoginErrorMessage(new Error('Invalid credentials'))).toBe(
      'Invalid credentials'
    );
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
