import { screen, fireEvent } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import localization from '@/i18n/localization.json';
import RegistrationNotification, {
  BACK_CLOSE_ANIMATION_MS,
} from '@/modules/User/features/Auth/components/form-section/auth-forms/registration-notification';

import renderWithProviders from '../../../../../../../utils/renderWithProviders';

jest.mock('@/assets/notification/confetti.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/notification/error.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/notification/settings.svg', () => ({ ReactComponent: 'svg' }));

const createUkrainianI18n = (): ReturnType<typeof i18n.createInstance> => {
  const instance = i18n.createInstance();
  instance.use(initReactI18next).init({
    lng: 'uk',
    fallbackLng: 'uk',
    resources: {
      uk: { translation: localization.uk.translation },
    },
    interpolation: { escapeValue: false },
    initImmediate: false,
  });

  return instance;
};

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
      { i18nMock: createUkrainianI18n() }
    );

    expect(screen.getByText('Помилка реєстрації. Спробуйте пізніше')).toBeInTheDocument();
  });

  it('keeps custom backend error text when it is not the generic validation fallback', () => {
    renderWithProviders(
      <RegistrationNotification
        isSubmitting={baseProps.isSubmitting}
        onBack={baseProps.onBack}
        view={baseProps.view}
        errorText="Custom backend error"
      />,
      { i18nMock: createUkrainianI18n() }
    );

    expect(screen.getByText('Custom backend error')).toBeInTheDocument();
  });

  it('falls back to the default localized error when no error text is provided', () => {
    renderWithProviders(
      <RegistrationNotification
        isSubmitting={baseProps.isSubmitting}
        onBack={baseProps.onBack}
        view={baseProps.view}
      />,
      { i18nMock: createUkrainianI18n() }
    );

    expect(
      screen.getByText('Щось пішло не так із запитом. Спробуйте ще раз пізніше')
    ).toBeInTheDocument();
  });

  it('renders the success notification', () => {
    renderWithProviders(
      <RegistrationNotification
        isSubmitting={false}
        onBack={jest.fn()}
        view="success"
      />,
      { i18nMock: createUkrainianI18n() }
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
      { i18nMock: createUkrainianI18n() }
    );

    expect(onShown).toHaveBeenCalledTimes(1);
  });

  it('calls onBack immediately when back is clicked in success view', () => {
    const onBack = jest.fn();
    renderWithProviders(
      <RegistrationNotification
        isSubmitting={false}
        onBack={onBack}
        view="success"
      />,
      { i18nMock: createUkrainianI18n() }
    );

    fireEvent.click(screen.getByText('Назад'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('calls onBack after animation delay when back is clicked in error view', () => {
    jest.useFakeTimers();
    const onBack = jest.fn();
    renderWithProviders(
      <RegistrationNotification
        isSubmitting={false}
        onBack={onBack}
        view="error"
      />,
      { i18nMock: createUkrainianI18n() }
    );

    fireEvent.click(screen.getByText('Назад'));
    expect(onBack).not.toHaveBeenCalled();
    jest.advanceTimersByTime(BACK_CLOSE_ANIMATION_MS);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('clears the close timer on unmount', () => {
    jest.useFakeTimers();
    const onBack = jest.fn();
    const { unmount } = renderWithProviders(
      <RegistrationNotification
        isSubmitting={false}
        onBack={onBack}
        view="error"
      />,
      { i18nMock: createUkrainianI18n() }
    );

    fireEvent.click(screen.getByText('Назад'));
    unmount();
    jest.advanceTimersByTime(BACK_CLOSE_ANIMATION_MS);
    expect(onBack).not.toHaveBeenCalled();
  });

  it('renders the retry button and disables it while submitting', () => {
    const onRetry = jest.fn();

    renderWithProviders(
      <RegistrationNotification
        isSubmitting
        onBack={jest.fn()}
        onRetry={onRetry}
        view="error"
      />,
      { i18nMock: createUkrainianI18n() }
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
      { i18nMock: createUkrainianI18n() }
    );

    fireEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
