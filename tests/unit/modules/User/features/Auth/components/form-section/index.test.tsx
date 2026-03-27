import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ButtonHTMLAttributes, ComponentType, ReactElement } from 'react';
import { Suspense } from 'react';

import FormSection from '@/modules/User/features/Auth/components/form-section';

const uiButtonMock = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

jest.mock('@/components/UIButton', () => ({
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

jest.mock('@/components/UITypography', () => ({
  __esModule: true,
  default: ({
    children,
    role,
  }: {
    children: ReactElement | string;
    role?: string;
  }): ReactElement => <span role={role}>{children}</span>,
}));

jest.mock(
  '@/modules/User/features/Auth/components/form-section/auth-forms/login-form',
  () => ({
    __esModule: true,
    default: (): ReactElement => <div data-testid="login-form" />,
  })
);

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

function renderFormSection(): ReturnType<typeof render> {
  return render(
    <Suspense fallback={<div data-testid="form-section-loading" />}>
      <FormSection />
    </Suspense>
  );
}

describe('FormSection', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the registration form and auth providers by default', () => {
    renderFormSection();

    expect(screen.getByTestId('registration-form')).toBeInTheDocument();
    expect(screen.getByTestId('auth-provider-buttons')).toBeInTheDocument();
  });

  it('switches to login mode when the switcher button is clicked', async () => {
    renderFormSection();

    fireEvent.click(screen.getByText('sign_up.form.switcher_text_have_account'));

    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
  });

  it('preloads the login form on switcher intent while still in register mode', () => {
    renderFormSection();

    fireEvent.mouseEnter(screen.getByText('sign_up.form.switcher_text_have_account'));

    expect(screen.getByTestId('registration-form')).toBeInTheDocument();
  });

  it('switches back to registration mode and clears prior login load errors', async () => {
    renderFormSection();

    fireEvent.click(screen.getByText('sign_up.form.switcher_text_have_account'));

    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('sign_up.form.switcher_text_no_account'));

    expect(screen.getByTestId('registration-form')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('ignores repeated switch clicks while the login transition is marked as loading', async () => {
    renderFormSection();

    fireEvent.click(screen.getByText('sign_up.form.switcher_text_have_account'));

    await waitFor(() => {
      const disabledRender = uiButtonMock.mock.calls
        .map(([props]) => props)
        .find((props) => props.disabled);

      expect(disabledRender).toBeDefined();
      disabledRender?.onClick?.({} as never);
    });
  });

  it('marks auth provider buttons as inert when notification view is active', () => {
    renderFormSection();
    const authProviderContainer = (
      screen
        .getAllByRole('generic')
        .find((element) => element.id === 'auth-provider-buttons-container') as HTMLElement
    );

    expect(authProviderContainer).not.toHaveAttribute('inert');

    fireEvent.click(screen.getByTestId('trigger-success-view'));

    expect(authProviderContainer).toHaveAttribute('inert');
  });

  it('shows an error when the lazy login form fails to load', async () => {
    jest.resetModules();
    jest.doMock('react-i18next', () => ({
      useTranslation: (): { t: (key: string) => string } => ({
        t: (key: string): string => key,
      }),
    }));

    jest.doMock('@/components/UIButton', () => ({
      __esModule: true,
      default: (props: {
        children: ReactElement | string;
      } & ButtonHTMLAttributes<HTMLButtonElement>): ReactElement => {
        const { children, disabled, onClick, onMouseEnter, onFocus, onTouchStart } = props;

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

    jest.doMock('@/components/UITypography', () => ({
      __esModule: true,
      default: ({
        children,
        role,
      }: {
        children: ReactElement | string;
        role?: string;
      }): ReactElement => <span role={role}>{children}</span>,
    }));

    jest.doMock(
      '@/modules/User/features/Auth/components/form-section/auth-forms/registration-form',
      () => ({
        __esModule: true,
        default: (): ReactElement => <div data-testid="registration-form" />,
      })
    );

    jest.doMock(
      '@/modules/User/features/Auth/components/form-section/components/auth-provider-buttons',
      () => ({
        __esModule: true,
        default: (): ReactElement => <div data-testid="auth-provider-buttons" />,
      })
    );

    jest.doMock(
      '@/modules/User/features/Auth/components/form-section/auth-forms/login-form',
      () => {
        throw new Error('lazy login chunk failed');
      }
    );

    let renderLocal!: typeof render;
    let SuspenseLocal!: typeof Suspense;
    let IsolatedFormSection: ComponentType | null = null;

    jest.isolateModules(() => {
      const ReactLocal = jest.requireActual('react') as typeof import('react');
      const TestingLibrary = jest.requireActual(
        '@testing-library/react/pure'
      ) as typeof import('@testing-library/react/pure');

      renderLocal = TestingLibrary.render;
      SuspenseLocal = ReactLocal.Suspense;
      IsolatedFormSection = (
        jest.requireActual('@/modules/User/features/Auth/components/form-section') as {
          default: ComponentType;
        }
      ).default;
    });

    if (!IsolatedFormSection) {
      throw new Error('Failed to load isolated FormSection');
    }

    const IsolatedFormSectionComponent = IsolatedFormSection as () => JSX.Element;

    const view = renderLocal(
      <SuspenseLocal fallback={<div data-testid="form-section-loading" />}>
        <IsolatedFormSectionComponent />
      </SuspenseLocal>
    );

    try {
      fireEvent.click(screen.getByText('sign_up.form.switcher_text_have_account'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('sign_in.errors.load_failed');
      });
    } finally {
      view.unmount();
    }
  });

  it('swallows preload failures triggered by switcher intent', async () => {
    jest.resetModules();

    jest.doMock('react-i18next', () => ({
      useTranslation: (): { t: (key: string) => string } => ({
        t: (key: string): string => key,
      }),
    }));

    jest.doMock('@/components/UIButton', () => ({
      __esModule: true,
      default: (props: {
        children: ReactElement | string;
      } & ButtonHTMLAttributes<HTMLButtonElement>): ReactElement => {
        const { children, disabled, onClick, onMouseEnter, onFocus, onTouchStart } = props;

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

    jest.doMock('@/components/UITypography', () => ({
      __esModule: true,
      default: ({
        children,
        role,
      }: {
        children: ReactElement | string;
        role?: string;
      }): ReactElement => <span role={role}>{children}</span>,
    }));

    jest.doMock(
      '@/modules/User/features/Auth/components/form-section/auth-forms/registration-form',
      () => ({
        __esModule: true,
        default: (): ReactElement => <div data-testid="registration-form" />,
      })
    );

    jest.doMock(
      '@/modules/User/features/Auth/components/form-section/components/auth-provider-buttons',
      () => ({
        __esModule: true,
        default: (): ReactElement => <div data-testid="auth-provider-buttons" />,
      })
    );

    jest.doMock(
      '@/modules/User/features/Auth/components/form-section/auth-forms/login-form',
      () => {
        throw new Error('preload failed');
      }
    );

    let renderLocal!: typeof render;
    let SuspenseLocal!: typeof Suspense;
    let IsolatedFormSection: ComponentType | null = null;

    jest.isolateModules(() => {
      const ReactLocal = jest.requireActual('react') as typeof import('react');
      const TestingLibrary = jest.requireActual(
        '@testing-library/react/pure'
      ) as typeof import('@testing-library/react/pure');

      renderLocal = TestingLibrary.render;
      SuspenseLocal = ReactLocal.Suspense;
      IsolatedFormSection = (
        jest.requireActual('@/modules/User/features/Auth/components/form-section') as {
          default: ComponentType;
        }
      ).default;
    });

    if (!IsolatedFormSection) {
      throw new Error('Failed to load isolated FormSection');
    }

    const IsolatedFormSectionComponent = IsolatedFormSection as () => JSX.Element;

    const view = renderLocal(
      <SuspenseLocal fallback={<div data-testid="form-section-loading" />}>
        <IsolatedFormSectionComponent />
      </SuspenseLocal>
    );

    try {
      fireEvent.mouseEnter(screen.getByText('sign_up.form.switcher_text_have_account'));

      await waitFor(() => {
        expect(screen.getByTestId('registration-form')).toBeInTheDocument();
      });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    } finally {
      view.unmount();
    }
  });
});
