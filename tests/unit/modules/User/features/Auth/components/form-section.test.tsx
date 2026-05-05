// @jest-environment jsdom
/* eslint-disable testing-library/prefer-screen-queries */

import '../../../../../utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { act, type ButtonHTMLAttributes, type ReactElement } from 'react';

type LoginFormModule =
  typeof import('@/modules/User/features/Auth/components/form-section/auth-forms/login-form');

const uiButtonMock = jest.fn();
const mockLoginFormDefault = (): ReactElement => <div data-testid="login-form" />;
const mockNormalizeLoginErrorMessage = jest.fn(() => 'auth.errors.unknown');
const loadLoginFormMock = jest.fn(
  async (): Promise<LoginFormModule> => ({
    default: mockLoginFormDefault,
    normalizeLoginErrorMessage: mockNormalizeLoginErrorMessage,
  })
);

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

jest.mock('@/components/ui-button', () => ({
  __esModule: true,
  default: (
    props: {
      children: ReactElement | string;
    } & ButtonHTMLAttributes<HTMLButtonElement>
  ): ReactElement => {
    const { children, disabled, onClick, onMouseEnter, onFocus, onTouchStart } = props;

    uiButtonMock(props);

    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onFocus={onFocus}
        onTouchStart={onTouchStart}
      >
        {children}
      </button>
    );
  },
}));

jest.mock('@/components/ui-typography', () => ({
  __esModule: true,
  default: ({
    children,
    component,
    role,
  }: {
    children: ReactElement | string;
    component?: keyof JSX.IntrinsicElements;
    role?: string;
  }): ReactElement => {
    const Component = component ?? 'span';
    return <Component role={role}>{children}</Component>;
  },
}));

jest.mock('@/modules/User/features/Auth/utils/load-login-form', () => ({
  __esModule: true,
  default: loadLoginFormMock,
}));

jest.mock(
  '@/modules/User/features/Auth/components/form-section/auth-forms/registration-form',
  () => ({
    __esModule: true,
    default: ({ onViewChange }: { onViewChange?: (view: string) => void }): ReactElement => (
      <div data-testid="registration-form">
        <button
          type="button"
          data-testid="trigger-success-view"
          onClick={() => onViewChange?.('success')}
        />
      </div>
    ),
  })
);

jest.mock('@/modules/User/features/Auth/components/form-section/auth-forms/login-form', () => ({
  __esModule: true,
  default: mockLoginFormDefault,
  normalizeLoginErrorMessage: mockNormalizeLoginErrorMessage,
}));

jest.mock(
  '@/modules/User/features/Auth/components/form-section/components/auth-provider-buttons',
  () => ({
    __esModule: true,
    default: (): ReactElement => <div data-testid="auth-provider-buttons" />,
  })
);

let FormSection!: (typeof import('@/modules/User/features/Auth/components/form-section'))['default'];

describe('FormSection', () => {
  beforeAll(async () => {
    ({ default: FormSection } =
      await import('../../../../../../../src/modules/User/features/Auth/components/form-section'));
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.replaceChildren();
  });

  it('renders the primary form and social providers immediately', () => {
    const view = render(<FormSection />);

    expect(view.getByTestId('registration-form')).toBeInTheDocument();
    expect(view.getByTestId('auth-provider-buttons')).toBeInTheDocument();
  });

  it('keeps the current form visible across rerenders', async () => {
    const view = render(<FormSection />);
    const { rerender } = view;

    expect(view.getByTestId('registration-form')).toBeInTheDocument();
    expect(view.getByTestId('auth-provider-buttons')).toBeInTheDocument();

    rerender(<FormSection />);

    await waitFor(() => {
      expect(view.getByTestId('registration-form')).toBeInTheDocument();
    });

    expect(view.getByTestId('auth-provider-buttons')).toBeInTheDocument();
  });

  it('switches to login mode when the switcher button is clicked', async () => {
    const view = render(<FormSection />);

    expect(view.getByTestId('registration-form')).toBeInTheDocument();

    fireEvent.click(view.getByText('sign_up.form.switcher_text_have_account'));

    expect(view.getByTestId('registration-form')).toBeInTheDocument();
    expect(view.queryByTestId('login-form')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(view.getByTestId('login-form')).toBeInTheDocument();
    });

    expect(view.queryByTestId('registration-form')).not.toBeInTheDocument();
    expect(view.getByText('sign_up.form.switcher_text_no_account')).toBeInTheDocument();
  });

  it('disables the switcher and ignores repeated clicks while the login form is loading', async () => {
    let resolveLoginForm: ((value: LoginFormModule) => void) | undefined;

    loadLoginFormMock.mockImplementationOnce(
      () =>
        new Promise<LoginFormModule>((resolve) => {
          resolveLoginForm = resolve;
        })
    );

    const view = render(<FormSection />);

    const switcherButton = view.getByText('sign_up.form.switcher_text_have_account');

    fireEvent.click(switcherButton);

    expect(switcherButton).toBeDisabled();

    const repeatedClickHandler = uiButtonMock.mock.lastCall?.[0]
      ?.onClick as ButtonHTMLAttributes<HTMLButtonElement>['onClick'];

    expect(repeatedClickHandler).toBeDefined();

    act(() => {
      repeatedClickHandler?.({} as never);
    });

    expect(loadLoginFormMock).toHaveBeenCalledTimes(1);

    resolveLoginForm?.({
      default: mockLoginFormDefault,
      normalizeLoginErrorMessage: mockNormalizeLoginErrorMessage,
    });

    await waitFor(() => {
      expect(view.getByTestId('login-form')).toBeInTheDocument();
    });
  });

  it('triggers prefetch on switcher hover', () => {
    const view = render(<FormSection />);

    fireEvent.mouseEnter(view.getByText('sign_up.form.switcher_text_have_account'));

    expect(view.getByText('sign_up.form.switcher_text_have_account')).toBeInTheDocument();
    expect(loadLoginFormMock).toHaveBeenCalledTimes(1);
  });

  it('swallows login prefetch errors from focus intent', async () => {
    loadLoginFormMock.mockRejectedValueOnce(new Error('prefetch failed'));

    const view = render(<FormSection />);

    fireEvent.focus(view.getByText('sign_up.form.switcher_text_have_account'));

    await waitFor(() => {
      expect(loadLoginFormMock).toHaveBeenCalledTimes(1);
    });

    expect(view.getByTestId('registration-form')).toBeInTheDocument();
    expect(view.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('toggles back to registration mode on a second click', async () => {
    const view = render(<FormSection />);

    fireEvent.click(view.getByText('sign_up.form.switcher_text_have_account'));

    await waitFor(() => {
      expect(view.getByTestId('login-form')).toBeInTheDocument();
    });

    fireEvent.click(view.getByText('sign_up.form.switcher_text_no_account'));

    expect(view.getByTestId('registration-form')).toBeInTheDocument();
    expect(view.queryByTestId('login-form')).not.toBeInTheDocument();
  });

  it('shows an inline error and keeps registration visible when the login form fails to load', async () => {
    loadLoginFormMock.mockRejectedValueOnce(new Error('chunk load failed'));

    const view = render(<FormSection />);

    fireEvent.click(view.getByText('sign_up.form.switcher_text_have_account'));

    await waitFor(() => {
      expect(view.getByRole('alert')).toHaveTextContent('sign_in.errors.load_failed');
    });

    expect(view.getByTestId('registration-form')).toBeInTheDocument();
    expect(view.queryByTestId('login-form')).not.toBeInTheDocument();
  });

  it('marks auth provider buttons as inert when notification view is active', () => {
    const view = render(<FormSection />);

    expect(view.getByTestId('auth-provider-buttons-container')).not.toHaveAttribute('inert');

    fireEvent.click(view.getByTestId('trigger-success-view'));

    expect(view.getByTestId('auth-provider-buttons-container')).toHaveAttribute('inert');
  });

  it('clears notification view when switching modes', async () => {
    const view = render(<FormSection />);

    fireEvent.click(view.getByTestId('trigger-success-view'));
    expect(view.getByTestId('auth-provider-buttons-container')).toHaveAttribute('inert');

    fireEvent.click(view.getByText('sign_up.form.switcher_text_have_account'));

    await waitFor(() => {
      expect(view.getByTestId('login-form')).toBeInTheDocument();
    });

    fireEvent.click(view.getByText('sign_up.form.switcher_text_no_account'));

    expect(view.getByTestId('auth-provider-buttons-container')).not.toHaveAttribute('inert');
  });
});
