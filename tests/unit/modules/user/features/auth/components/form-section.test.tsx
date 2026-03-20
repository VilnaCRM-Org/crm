import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ButtonHTMLAttributes, ReactElement } from 'react';

import FormSection from '@/modules/user/features/auth/components/form-section';
import loadLoginForm from '@/modules/user/features/auth/utils/load-login-form';

const uiButtonMock = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

jest.mock('@/components/ui-button', () => ({
  __esModule: true,
  default: (props: {
    children: ReactElement | string;
  } & ButtonHTMLAttributes<HTMLButtonElement>): ReactElement => {
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

jest.mock('@/modules/user/features/auth/utils/load-login-form', () => ({
  __esModule: true,
  default: jest.fn(async (): Promise<{ default: () => ReactElement }> => ({
    default: (): ReactElement => <div data-testid="login-form" />,
  })),
}));

jest.mock('@/modules/user/features/auth/components/form-section/auth-forms/registration-form', () => ({
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
}));

jest.mock('@/modules/user/features/auth/components/form-section/auth-forms/login-form', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="login-form" />,
}));

jest.mock('@/modules/user/features/auth/components/form-section/components/auth-provider-buttons', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="auth-provider-buttons" />,
}));

describe('FormSection', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the primary form and social providers immediately', () => {
    render(<FormSection />);

    expect(screen.getByTestId('registration-form')).toBeInTheDocument();
    expect(screen.getByTestId('auth-provider-buttons')).toBeInTheDocument();
  });

  it('keeps the current form visible across rerenders', async () => {
    const { rerender } = render(<FormSection />);

    expect(screen.getByTestId('registration-form')).toBeInTheDocument();
    expect(screen.getByTestId('auth-provider-buttons')).toBeInTheDocument();

    rerender(<FormSection />);

    await waitFor(() => {
      expect(screen.getByTestId('registration-form')).toBeInTheDocument();
    });

    expect(screen.getByTestId('auth-provider-buttons')).toBeInTheDocument();
  });

  it('switches to login mode when the switcher button is clicked', async () => {
    render(<FormSection />);

    expect(screen.getByTestId('registration-form')).toBeInTheDocument();

    fireEvent.click(screen.getByText('sign_up.form.switcher_text_have_account'));

    expect(screen.getByTestId('registration-form')).toBeInTheDocument();
    expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('registration-form')).not.toBeInTheDocument();
    expect(screen.getByText('sign_up.form.switcher_text_no_account')).toBeInTheDocument();
  });

  it('disables the switcher and ignores repeated clicks while the login form is loading', async () => {
    let resolveLoginForm: ((value: { default: () => ReactElement }) => void) | undefined;

    jest
      .mocked(loadLoginForm)
      .mockImplementationOnce(
        () =>
          new Promise<{ default: () => ReactElement }>((resolve) => {
            resolveLoginForm = resolve;
          })
      );

    render(<FormSection />);

    const switcherButton = screen.getByText('sign_up.form.switcher_text_have_account');

    fireEvent.click(switcherButton);

    expect(switcherButton).toBeDisabled();

    const repeatedClickHandler = uiButtonMock.mock.lastCall?.[0]
      ?.onClick as ButtonHTMLAttributes<HTMLButtonElement>['onClick'];

    expect(repeatedClickHandler).toBeDefined();

    repeatedClickHandler?.({} as never);

    expect(loadLoginForm).toHaveBeenCalledTimes(1);

    resolveLoginForm?.({
      default: (): ReactElement => <div data-testid="login-form" />,
    });

    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
  });

  it('triggers prefetch on switcher hover', () => {
    render(<FormSection />);

    fireEvent.mouseEnter(screen.getByText('sign_up.form.switcher_text_have_account'));

    expect(screen.getByText('sign_up.form.switcher_text_have_account')).toBeInTheDocument();
    expect(loadLoginForm).toHaveBeenCalledTimes(1);
  });

  it('swallows login prefetch errors from focus intent', async () => {
    jest.mocked(loadLoginForm).mockRejectedValueOnce(new Error('prefetch failed'));

    render(<FormSection />);

    fireEvent.focus(screen.getByText('sign_up.form.switcher_text_have_account'));

    await waitFor(() => {
      expect(loadLoginForm).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByTestId('registration-form')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('toggles back to registration mode on a second click', async () => {
    render(<FormSection />);

    fireEvent.click(screen.getByText('sign_up.form.switcher_text_have_account'));

    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('sign_up.form.switcher_text_no_account'));

    expect(screen.getByTestId('registration-form')).toBeInTheDocument();
    expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
  });

  it('shows an inline error and keeps registration visible when the login form fails to load', async () => {
    jest.mocked(loadLoginForm).mockRejectedValueOnce(new Error('chunk load failed'));

    render(<FormSection />);

    fireEvent.click(screen.getByText('sign_up.form.switcher_text_have_account'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('sign_in.errors.load_failed');
    });

    expect(screen.getByTestId('registration-form')).toBeInTheDocument();
    expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
  });

  it('marks auth provider buttons as inert when notification view is active', () => {
    render(<FormSection />);

    expect(screen.getByTestId('auth-provider-buttons-container')).not.toHaveAttribute('inert');

    fireEvent.click(screen.getByTestId('trigger-success-view'));

    expect(screen.getByTestId('auth-provider-buttons-container')).toHaveAttribute('inert');
  });

  it('clears notification view when switching modes', async () => {
    render(<FormSection />);

    fireEvent.click(screen.getByTestId('trigger-success-view'));
    expect(screen.getByTestId('auth-provider-buttons-container')).toHaveAttribute('inert');

    fireEvent.click(screen.getByText('sign_up.form.switcher_text_have_account'));

    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('sign_up.form.switcher_text_no_account'));

    expect(screen.getByTestId('auth-provider-buttons-container')).not.toHaveAttribute('inert');
  });
});
