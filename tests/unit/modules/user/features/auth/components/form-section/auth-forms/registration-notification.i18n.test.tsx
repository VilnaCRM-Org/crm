import { screen, fireEvent } from '@testing-library/react';
import { act } from 'react';

import localization from '@/i18n/localization.json';
import RegistrationNotification, {
  BACK_CLOSE_ANIMATION_MS,
} from '@/modules/user/features/auth/components/form-section/auth-forms/registration-notification';

import createLocaleI18n from '../../../../../../../utils/create-locale-i18n';
import renderWithProviders from '../../../../../../../utils/render-with-providers';

jest.mock('@/assets/notification/confetti.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/notification/error.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/notification/settings.svg', () => ({ ReactComponent: 'svg' }));

const ukrainianTranslation = localization.uk.translation;

describe('RegistrationNotification', () => {
  const baseProps = {
    isSubmitting: false,
    onBack: jest.fn(),
    view: 'error' as const,
  };

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('shows the Ukrainian registration error for the English validation fallback', () => {
    renderWithProviders(
      <RegistrationNotification
        isSubmitting={baseProps.isSubmitting}
        onBack={baseProps.onBack}
        view={baseProps.view}
        errorText="Invalid data provided"
      />,
      { i18nMock: createLocaleI18n('uk') }
    );

    expect(screen.getByText(ukrainianTranslation.sign_up.errors.signup_error)).toBeInTheDocument();
  });

  it('replaces unrecognized backend error text with the localized generic error', () => {
    renderWithProviders(
      <RegistrationNotification
        isSubmitting={baseProps.isSubmitting}
        onBack={baseProps.onBack}
        view={baseProps.view}
        errorText="Unexpected response from server"
      />,
      { i18nMock: createLocaleI18n('uk') }
    );

    expect(screen.getByText(ukrainianTranslation.sign_up.errors.signup_error)).toBeInTheDocument();
    expect(screen.queryByText('Unexpected response from server')).not.toBeInTheDocument();
  });

  it('maps a duplicate-email backend error to the localized email-in-use message', () => {
    renderWithProviders(
      <RegistrationNotification
        isSubmitting={baseProps.isSubmitting}
        onBack={baseProps.onBack}
        view={baseProps.view}
        errorText="This email already exists"
      />,
      { i18nMock: createLocaleI18n('uk') }
    );

    expect(screen.getByText(ukrainianTranslation.sign_up.errors.email_used)).toBeInTheDocument();
  });

  it('treats whitespace-only backend error text as absent', () => {
    renderWithProviders(
      <RegistrationNotification
        isSubmitting={baseProps.isSubmitting}
        onBack={baseProps.onBack}
        view={baseProps.view}
        errorText="   "
      />,
      { i18nMock: createLocaleI18n('uk') }
    );

    expect(
      screen.getByText(ukrainianTranslation.failure_responses.client_errors.something_went_wrong)
    ).toBeInTheDocument();
  });

  it('falls back to the default localized error when no error text is provided', () => {
    renderWithProviders(
      <RegistrationNotification
        isSubmitting={baseProps.isSubmitting}
        onBack={baseProps.onBack}
        view={baseProps.view}
      />,
      { i18nMock: createLocaleI18n('uk') }
    );

    expect(
      screen.getByText(ukrainianTranslation.failure_responses.client_errors.something_went_wrong)
    ).toBeInTheDocument();
  });

  it('renders the success notification', () => {
    renderWithProviders(
      <RegistrationNotification isSubmitting={false} onBack={jest.fn()} view="success" />,
      { i18nMock: createLocaleI18n('uk') }
    );

    expect(screen.getByText('Вітаємо!')).toBeInTheDocument();
  });

  it('calls onShown when success view is mounted', () => {
    const onShown = jest.fn();
    renderWithProviders(
      <RegistrationNotification
        isSubmitting={false}
        onBack={jest.fn()}
        view="success"
        onShown={onShown}
      />,
      { i18nMock: createLocaleI18n('uk') }
    );

    expect(onShown).toHaveBeenCalledTimes(1);
  });

  it('calls onBack immediately when back is clicked in success view', () => {
    const onBack = jest.fn();
    renderWithProviders(
      <RegistrationNotification isSubmitting={false} onBack={onBack} view="success" />,
      { i18nMock: createLocaleI18n('uk') }
    );

    fireEvent.click(screen.getByText('Назад'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('calls onBack after animation delay when back is clicked in error view', () => {
    jest.useFakeTimers();
    const onBack = jest.fn();
    renderWithProviders(
      <RegistrationNotification isSubmitting={false} onBack={onBack} view="error" />,
      { i18nMock: createLocaleI18n('uk') }
    );

    fireEvent.click(screen.getByText('Назад'));
    expect(onBack).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(BACK_CLOSE_ANIMATION_MS);
    });
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('clears the close timer on unmount', () => {
    jest.useFakeTimers();
    const onBack = jest.fn();
    const { unmount } = renderWithProviders(
      <RegistrationNotification isSubmitting={false} onBack={onBack} view="error" />,
      { i18nMock: createLocaleI18n('uk') }
    );

    fireEvent.click(screen.getByText('Назад'));
    unmount();
    act(() => {
      jest.advanceTimersByTime(BACK_CLOSE_ANIMATION_MS);
    });
    expect(onBack).not.toHaveBeenCalled();
  });

  it('renders the retry button and disables it while submitting', () => {
    const onRetry = jest.fn();

    renderWithProviders(
      <RegistrationNotification isSubmitting onBack={jest.fn()} onRetry={onRetry} view="error" />,
      { i18nMock: createLocaleI18n('uk') }
    );

    const retryButton = screen.getByRole('button', { name: 'Спробувати ще раз' });

    expect(retryButton).toBeDisabled();
    fireEvent.click(retryButton);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('calls onRetry when the retry button is enabled', () => {
    const onRetry = jest.fn();

    renderWithProviders(
      <RegistrationNotification
        isSubmitting={false}
        onBack={jest.fn()}
        onRetry={onRetry}
        view="error"
      />,
      { i18nMock: createLocaleI18n('uk') }
    );

    fireEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
