import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useFormContext } from 'react-hook-form';
import { BrowserRouter } from 'react-router-dom';

import UIButton from '@/components/UIButton';
import UIForm from '@/components/UIForm';
import RegistrationForm from '@auth/components/form-section/auth-forms/registration-form';
import UserOptions from '@auth/components/form-section/components/user-options';
import type { RegistrationView } from '@auth/components/form-section/types';
import loadRegistrationNotification from '@auth/utils/load-registration-notification';

const mockUseRegistrationForm = jest.fn();
const mockRegistrationNotification = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({ t: (key: string): string => key }),
}));

jest.mock('@auth/hooks/use-registration-form', () => ({
  __esModule: true,
  default: (...args: unknown[]): unknown => mockUseRegistrationForm(...args),
}));

jest.mock('@auth/components/form-section/auth-forms/registration-notification', () => ({
  __esModule: true,
  default: (props: {
    view: RegistrationView;
    errorText: string;
    isSubmitting: boolean;
    onShown: () => void;
    onBack: () => void;
    onRetry: () => void;
  }): JSX.Element => {
    mockRegistrationNotification(props);
    return (
      <div data-testid="registration-notification">
        <button type="button" onClick={props.onShown}>
          shown
        </button>
        <button type="button" onClick={props.onBack}>
          back
        </button>
        <button type="button" onClick={props.onRetry}>
          retry
        </button>
      </div>
    );
  },
}));

jest.mock('@auth/components/form-section/auth-forms/registration-form-fields', () => ({
  __esModule: true,
  default: (): JSX.Element => <div data-testid="registration-fields" />,
}));

const baseRegistrationFormState = {
  view: 'form' as RegistrationView,
  errorText: '',
  formKey: 0,
  isSubmitting: false,
  handleRegister: jest.fn(),
  handleSuccessShown: jest.fn(),
  handleBackToForm: jest.fn(),
  handleRetry: jest.fn(),
};

function NameInput(): JSX.Element {
  const { register } = useFormContext<{ name: string }>();
  const { name, onChange, onBlur, ref } = register('name');
  return <input aria-label="Name" name={name} onChange={onChange} onBlur={onBlur} ref={ref} />;
}

describe('UIButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRegistrationForm.mockReturnValue(baseRegistrationFormState);
  });

  describe('Rendering as RouterLink', () => {
    it('should render as RouterLink when to prop is provided', () => {
      render(
        <BrowserRouter>
          <UIButton to="/test-path">Test Link Button</UIButton>
        </BrowserRouter>
      );

      const button = screen.getByRole('link');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('href', '/test-path');
      expect(button.tagName.toLowerCase()).toBe('a');
    });

    it('should render with text content when used as link', () => {
      render(
        <BrowserRouter>
          <UIButton to="/home">Go Home</UIButton>
        </BrowserRouter>
      );

      expect(screen.getByText('Go Home')).toBeInTheDocument();
    });
  });

  describe('Rendering as regular button', () => {
    it('should render as button when to prop is not provided', () => {
      render(<UIButton>Test Button</UIButton>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.tagName.toLowerCase()).toBe('button');
      expect(button).not.toHaveAttribute('href');
    });

    it('should render as button when to prop is empty string', () => {
      render(<UIButton to="">Empty To Prop</UIButton>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.tagName.toLowerCase()).toBe('button');
      expect(button).not.toHaveAttribute('to');
    });

    it('should render with text content when used as button', () => {
      render(<UIButton>Click Me</UIButton>);

      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });
  });

  describe('Props passing', () => {
    it('should pass through other Button props', () => {
      render(<UIButton disabled>Disabled Button</UIButton>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should pass through other Button props when used as link', () => {
      render(
        <BrowserRouter>
          <UIButton to="/test" disabled>
            Disabled Link
          </UIButton>
        </BrowserRouter>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveClass('Mui-disabled');
    });
  });

  describe('Theme integration', () => {
    it('should render with ThemeProvider wrapper', () => {
      render(<UIButton>Themed Button</UIButton>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-root');
    });
  });
});

describe('RegistrationForm and UserOptions components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRegistrationForm.mockReturnValue(baseRegistrationFormState);
  });

  it('renders the registration form and forwards the view change callback', () => {
    const onViewChange = jest.fn();

    render(<RegistrationForm onViewChange={onViewChange} />);

    expect(mockUseRegistrationForm).toHaveBeenCalledWith(onViewChange);
    expect(screen.getByText('sign_up.title')).toBeInTheDocument();
    expect(screen.queryByTestId('registration-notification')).not.toBeInTheDocument();
  });

  it('renders the registration notification for non-form views', async () => {
    const state = {
      ...baseRegistrationFormState,
      view: 'error' as RegistrationView,
      errorText: 'Try again',
    };
    mockUseRegistrationForm.mockReturnValue(state);

    render(<RegistrationForm />);

    expect(await screen.findByTestId('registration-notification')).toBeInTheDocument();
    expect(mockRegistrationNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        view: 'error',
        errorText: 'Try again',
      })
    );

    fireEvent.click(screen.getByText('shown'));
    fireEvent.click(screen.getByText('back'));
    fireEvent.click(screen.getByText('retry'));

    expect(state.handleSuccessShown).toHaveBeenCalled();
    expect(state.handleBackToForm).toHaveBeenCalled();
    expect(state.handleRetry).toHaveBeenCalled();
  });

  it('toggles remember-me options and renders the secondary action', () => {
    render(<UserOptions />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(
      screen.getByRole('button', { name: 'sign_in.form.forgot_password' })
    ).toBeInTheDocument();
  });

  it('loads and caches the lazy registration notification module', async () => {
    const first = await loadRegistrationNotification();
    const second = await loadRegistrationNotification();

    expect(first).toBe(second);
    expect(first.default).toBeDefined();
  });

  it('resets the lazy registration notification cache after a failed import', async () => {
    jest.resetModules();
    jest.doMock('@auth/components/form-section/auth-forms/registration-notification', () => {
      throw new Error('load failed');
    });
    const { default: loadNotification } =
      await import('@auth/utils/load-registration-notification');

    await expect(loadNotification()).rejects.toThrow('load failed');
    await expect(loadNotification()).rejects.toThrow('load failed');

    jest.dontMock('@auth/components/form-section/auth-forms/registration-notification');
  });
});

describe('UIForm Component', () => {
  it('submits form values, renders optional content, and resets after success', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    render(
      <UIForm<{ name: string }>
        onSubmit={onSubmit}
        defaultValues={{ name: 'Ada' }}
        error="Submission failed"
        submitLabel="Save"
        title={<span>Profile</span>}
        subtitle={<span>Edit details</span>}
        resetOnSuccess
      >
        <NameInput />
      </UIForm>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Submission failed');
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Edit details')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Grace' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'Grace' }));
    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue('Ada'));
  });

  it('hides header content and disables submit controls when requested', () => {
    render(
      <UIForm<{ name: string }>
        onSubmit={jest.fn()}
        defaultValues={{ name: '' }}
        submitLabel="Save"
        title={<span>Hidden title</span>}
        subtitle={<span>Hidden subtitle</span>}
        showTitle={false}
        showSubtitle={false}
        isSubmitting
        isSubmitDisabled
      >
        <NameInput />
      </UIForm>
    );

    expect(screen.queryByText('Hidden title')).not.toBeInTheDocument();
    expect(screen.queryByText('Hidden subtitle')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('uses default optional values when subtitle and control flags are omitted', () => {
    render(
      <UIForm<{ name: string }>
        onSubmit={jest.fn()}
        defaultValues={{ name: '' }}
        submitLabel="Save"
        title={<span>Visible title</span>}
      >
        <NameInput />
      </UIForm>
    );

    expect(screen.getByText('Visible title')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });
});
