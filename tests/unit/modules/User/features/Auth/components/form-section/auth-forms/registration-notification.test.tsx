import { act, fireEvent, screen } from '@testing-library/react';
import i18next, { type i18n as I18nInstance } from 'i18next';
import { createElement, type ReactElement, type SVGProps } from 'react';
import { initReactI18next } from 'react-i18next';

import RegistrationNotification from '@/modules/User/features/Auth/components/form-section/auth-forms/registration-notification';

import renderWithProviders from '../../../../../../../utils/render-with-providers';

jest.mock('@/assets/notification/confetti.svg', () => ({
  ReactComponent: (props: SVGProps<SVGSVGElement>): ReactElement => createElement('svg', props),
}));

jest.mock('@/assets/notification/error.svg', () => ({
  ReactComponent: (props: SVGProps<SVGSVGElement>): ReactElement => createElement('svg', props),
}));

jest.mock('@/assets/notification/settings.svg', () => ({
  ReactComponent: (props: SVGProps<SVGSVGElement>): ReactElement => createElement('svg', props),
}));

jest.mock('@/components/ui-button', () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    disabled,
  }: {
    children: ReactElement | string;
    disabled?: boolean;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
  }): ReactElement => (
    <button type="button" disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui-typography', () => ({
  __esModule: true,
  default: ({
    children,
    component,
  }: {
    children: ReactElement | string;
    component?: keyof JSX.IntrinsicElements;
  }): ReactElement => {
    const Component = component ?? 'span';
    return <Component>{children}</Component>;
  },
}));

const createI18nMock = (): I18nInstance => {
  const instance = i18next.createInstance();

  instance.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {
      en: {
        translation: {
          notifications: {
            success: {
              aria_label: 'Registration successful notification',
              title: 'Congratulations!',
              description: 'You have successfully registered',
              button: 'Go back',
              images: {
                confetti: 'Cheerful and colorful confetti',
                gears: 'Decorative celebration gears',
              },
            },
            error: {
              title: 'An error occurred',
              retry_button: 'Try again',
              button: 'Go back',
              images: {
                error: 'Red triangle with a warning about an error',
              },
            },
          },
          failure_responses: {
            client_errors: {
              something_went_wrong: 'Something went wrong with the request. Try again later',
            },
          },
        },
      },
    },
    interpolation: { escapeValue: false },
    initImmediate: false,
  });

  return instance;
};

describe('RegistrationNotification', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not render the retry button when no retry handler is provided', () => {
    renderWithProviders(
      <RegistrationNotification
        view="error"
        errorText="An error occurred"
        isSubmitting={false}
        onBack={jest.fn()}
      />,
      { i18nMock: createI18nMock() }
    );

    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument();
  });

  it('renders the retry button and calls onRetry when provided', () => {
    const onRetry = jest.fn();

    renderWithProviders(
      <RegistrationNotification
        view="error"
        errorText="An error occurred"
        isSubmitting={false}
        onBack={jest.fn()}
        onRetry={onRetry}
      />,
      { i18nMock: createI18nMock() }
    );

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('falls back to the localized request error when no explicit error text is provided', () => {
    renderWithProviders(
      <RegistrationNotification view="error" isSubmitting={false} onBack={jest.fn()} />,
      { i18nMock: createI18nMock() }
    );

    expect(
      screen.getByText('Something went wrong with the request. Try again later')
    ).toBeInTheDocument();
  });

  it('uses a translated aria-label for the success notification container', () => {
    renderWithProviders(
      <RegistrationNotification view="success" isSubmitting={false} onBack={jest.fn()} />,
      { i18nMock: createI18nMock() }
    );

    expect(screen.getByLabelText('Registration successful notification')).toBeInTheDocument();
  });

  it('calls onShown when the success notification renders', () => {
    const onShown = jest.fn();

    renderWithProviders(
      <RegistrationNotification
        view="success"
        isSubmitting={false}
        onShown={onShown}
        onBack={jest.fn()}
      />,
      { i18nMock: createI18nMock() }
    );

    expect(onShown).toHaveBeenCalledTimes(1);
  });

  it('calls onBack immediately for the success notification', () => {
    jest.useFakeTimers();
    const onBack = jest.fn();

    renderWithProviders(
      <RegistrationNotification view="success" isSubmitting={false} onBack={onBack} />,
      { i18nMock: createI18nMock() }
    );

    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('waits for the close animation to finish before calling onBack in the error notification', () => {
    jest.useFakeTimers();
    const onBack = jest.fn();

    renderWithProviders(
      <RegistrationNotification view="error" isSubmitting={false} onBack={onBack} />,
      { i18nMock: createI18nMock() }
    );

    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));

    act(() => {
      jest.advanceTimersByTime(299);
    });

    expect(onBack).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('clears a pending close timer on unmount', () => {
    jest.useFakeTimers();
    const onBack = jest.fn();
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const { unmount } = renderWithProviders(
      <RegistrationNotification view="error" isSubmitting={false} onBack={onBack} />,
      { i18nMock: createI18nMock() }
    );

    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    unmount();

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(onBack).not.toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });
});
