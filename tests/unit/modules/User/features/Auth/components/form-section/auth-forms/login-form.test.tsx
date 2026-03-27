import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';

import LoginForm, {
  normalizeLoginErrorMessage,
} from '@/modules/User/features/Auth/components/form-section/auth-forms/login-form';

const mockDispatch = jest.fn();
const mockLoginUser = jest.fn();
const mockFormField = jest.fn();
const mockUIForm = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
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

jest.mock(
  '@/modules/User/features/Auth/components/form-section/components/password-field',
  () => ({
    __esModule: true,
    default: (): ReactElement => <div data-testid="password-field" />,
  })
);

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
});

describe('normalizeLoginErrorMessage', () => {
  it('returns the nested data.message value when available', () => {
    expect(normalizeLoginErrorMessage({ data: { message: 'Invalid credentials' } })).toBe(
      'Invalid credentials'
    );
  });

  it('falls back to the unknown translation key when no message can be found', () => {
    expect(normalizeLoginErrorMessage({ data: {} })).toBe('auth.errors.unknown');
  });
});
