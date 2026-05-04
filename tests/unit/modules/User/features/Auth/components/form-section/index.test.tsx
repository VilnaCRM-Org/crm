// @jest-environment jsdom
/* eslint-disable testing-library/prefer-screen-queries */

import '../../../../../../utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { Suspense, type ButtonHTMLAttributes, type ReactElement } from 'react';

type LoginFormModule = typeof import(
  '@/modules/User/features/Auth/components/form-section/auth-forms/login-form'
);

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
    role,
  }: {
    children: ReactElement | string;
    role?: string;
  }): ReactElement => <span role={role}>{children}</span>,
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

jest.mock(
  '@/modules/User/features/Auth/components/form-section/components/auth-provider-buttons',
  () => ({
    __esModule: true,
    default: (): ReactElement => <div data-testid="auth-provider-buttons" />,
  })
);

let FormSection!: typeof import('@/modules/User/features/Auth/components/form-section')['default'];

function renderFormSection(): ReturnType<typeof render> {
  return render(
    <Suspense fallback={<div data-testid="form-section-loading" />}>
      <FormSection />
    </Suspense>
  );
}

describe('FormSection', () => {
  beforeAll(async () => {
    ({ default: FormSection } = await import(
      '../../../../../../../../src/modules/User/features/Auth/components/form-section'
    ));
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    loadLoginFormMock.mockReset();
    loadLoginFormMock.mockImplementation(
      async (): Promise<LoginFormModule> => ({
        default: mockLoginFormDefault,
        normalizeLoginErrorMessage: mockNormalizeLoginErrorMessage,
      })
    );
  });

  it('renders the registration form and auth providers by default', () => {
    const view = renderFormSection();

    expect(view.getByTestId('registration-form')).toBeInTheDocument();
    expect(view.getByTestId('auth-provider-buttons')).toBeInTheDocument();
  });

  it('switches to login mode when the switcher button is clicked', async () => {
    const view = renderFormSection();

    fireEvent.click(view.getByText('sign_up.form.switcher_text_have_account'));

    await waitFor(() => {
      expect(view.getByTestId('login-form')).toBeInTheDocument();
    });

    expect(loadLoginFormMock).toHaveBeenCalledTimes(2);
  });

  it('preloads the login form on switcher intent while still in register mode', async () => {
    const view = renderFormSection();

    fireEvent.mouseEnter(view.getByText('sign_up.form.switcher_text_have_account'));

    await waitFor(() => {
      expect(loadLoginFormMock).toHaveBeenCalledTimes(1);
    });

    expect(view.getByTestId('registration-form')).toBeInTheDocument();
    expect(view.queryByTestId('login-form')).not.toBeInTheDocument();
  });

  it('switches back to registration mode and clears prior login load errors', async () => {
    const view = renderFormSection();

    fireEvent.click(view.getByText('sign_up.form.switcher_text_have_account'));

    await waitFor(() => {
      expect(view.getByTestId('login-form')).toBeInTheDocument();
    });

    fireEvent.click(view.getByText('sign_up.form.switcher_text_no_account'));

    expect(view.getByTestId('registration-form')).toBeInTheDocument();
    expect(view.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('ignores repeated switch clicks while the login transition is marked as loading', async () => {
    let resolveLoginForm: ((value: LoginFormModule) => void) | undefined;

    loadLoginFormMock.mockImplementationOnce(
      () =>
        new Promise<LoginFormModule>((resolve) => {
          resolveLoginForm = resolve;
        })
    );

    const view = renderFormSection();

    try {
      fireEvent.click(view.getByText('sign_up.form.switcher_text_have_account'));

      let disabledRender:
        | ({
            disabled?: boolean;
            onClick?: (event: never) => void;
          } & Record<string, unknown>)
        | undefined;

      await waitFor(() => {
        disabledRender = uiButtonMock.mock.calls
          .map(([props]) => props)
          .find((props) => props.disabled);

        expect(disabledRender).toBeDefined();
      });

      expect(view.queryByRole('alert')).not.toBeInTheDocument();

      disabledRender?.onClick?.({} as never);

      expect(loadLoginFormMock).toHaveBeenCalledTimes(1);
    } finally {
      resolveLoginForm?.({
        default: mockLoginFormDefault,
        normalizeLoginErrorMessage: mockNormalizeLoginErrorMessage,
      });
      view.unmount();
    }
  });

  it('marks auth provider buttons as inert when notification view is active', () => {
    const view = renderFormSection();
    const authProviderContainer = view.getByTestId('auth-provider-buttons-container');

    expect(authProviderContainer).not.toHaveAttribute('inert');

    fireEvent.click(view.getByTestId('trigger-success-view'));

    expect(authProviderContainer).toHaveAttribute('inert');
  });

  it('shows an error when the lazy login form fails to load', async () => {
    loadLoginFormMock.mockRejectedValueOnce(new Error('lazy login chunk failed'));

    const view = renderFormSection();

    fireEvent.click(view.getByText('sign_up.form.switcher_text_have_account'));

    await waitFor(() => {
      expect(view.getByRole('alert')).toHaveTextContent('sign_in.errors.load_failed');
    });
  });

  it('swallows preload failures triggered by switcher intent', async () => {
    loadLoginFormMock.mockRejectedValueOnce(new Error('preload failed'));

    const view = renderFormSection();

    fireEvent.mouseEnter(view.getByText('sign_up.form.switcher_text_have_account'));

    await waitFor(() => {
      expect(loadLoginFormMock).toHaveBeenCalledTimes(1);
    });

    expect(view.queryByRole('alert')).not.toBeInTheDocument();
  });
});
