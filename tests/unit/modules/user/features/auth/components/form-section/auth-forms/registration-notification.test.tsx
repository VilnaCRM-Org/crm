import { screen, fireEvent } from '@testing-library/react';
import i18n from 'i18next';
import { act } from 'react';
import { initReactI18next } from 'react-i18next';

import localization from '@/i18n/localization.json';
import RegistrationNotification, {
  BACK_CLOSE_ANIMATION_MS,
} from '@/modules/user/features/auth/components/form-section/auth-forms/registration-notification';

import renderWithProviders from '../../../../../../../utils/render-with-providers';

jest.mock('@/assets/notification/confetti.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/notification/error.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/notification/settings.svg', () => ({ ReactComponent: 'svg' }));

const UK_ERR_LEAD = 'Щось пішло не так із запитом.';
const UK_ERR_TRAIL = 'Спробуйте ще раз пізніше';
const GENERIC_UK_ERROR = `${UK_ERR_LEAD} ${UK_ERR_TRAIL}`;

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

    const expected = 'Помилка реєстрації. Спробуйте пізніше';
    expect(screen.getByText(expected)).toBeInTheDocument();
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

    expect(screen.getByText(GENERIC_UK_ERROR)).toBeInTheDocument();
  });

  it('falls back to the default localized error when the error text is only whitespace', () => {
    renderWithProviders(
      <RegistrationNotification
        isSubmitting={baseProps.isSubmitting}
        onBack={baseProps.onBack}
        view={baseProps.view}
        errorText="   "
      />,
      { i18nMock: createUkrainianI18n() }
    );

    expect(screen.getByText(GENERIC_UK_ERROR)).toBeInTheDocument();
  });

  it('renders the success notification', () => {
    renderWithProviders(
      <RegistrationNotification isSubmitting={false} onBack={jest.fn()} view="success" />,
      { i18nMock: createUkrainianI18n() }
    );

    expect(screen.getByText('Вітаємо!')).toBeInTheDocument();
  });

  it('announces the success notification politely as a single status region', () => {
    renderWithProviders(
      <RegistrationNotification isSubmitting={false} onBack={jest.fn()} view="success" />,
      { i18nMock: createUkrainianI18n() }
    );

    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('moves focus off the body to the success notification on mount', () => {
    renderWithProviders(
      <RegistrationNotification isSubmitting={false} onBack={jest.fn()} view="success" />,
      { i18nMock: createUkrainianI18n() }
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveAccessibleName();
    expect(document.body).not.toHaveFocus();
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
      <RegistrationNotification isSubmitting={false} onBack={onBack} view="success" />,
      { i18nMock: createUkrainianI18n() }
    );

    fireEvent.click(screen.getByText('Назад'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('calls onBack after animation delay when back is clicked in error view', () => {
    jest.useFakeTimers();
    const onBack = jest.fn();
    renderWithProviders(
      <RegistrationNotification isSubmitting={false} onBack={onBack} view="error" />,
      { i18nMock: createUkrainianI18n() }
    );

    fireEvent.click(screen.getByText('Назад'));
    expect(onBack).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(BACK_CLOSE_ANIMATION_MS);
    });
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('only calls onBack once when back is clicked rapidly in error view', () => {
    jest.useFakeTimers();
    const onBack = jest.fn();
    renderWithProviders(
      <RegistrationNotification isSubmitting={false} onBack={onBack} view="error" />,
      { i18nMock: createUkrainianI18n() }
    );

    const backButton = screen.getByText('Назад');
    fireEvent.click(backButton);
    fireEvent.click(backButton);
    fireEvent.click(backButton);

    jest.advanceTimersByTime(BACK_CLOSE_ANIMATION_MS);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('clears the close timer on unmount', () => {
    jest.useFakeTimers();
    const onBack = jest.fn();
    const { unmount } = renderWithProviders(
      <RegistrationNotification isSubmitting={false} onBack={onBack} view="error" />,
      { i18nMock: createUkrainianI18n() }
    );

    fireEvent.click(screen.getByText('Назад'));
    unmount();
    act(() => {
      jest.advanceTimersByTime(BACK_CLOSE_ANIMATION_MS);
    });
    expect(onBack).not.toHaveBeenCalled();
  });

  it('renders a single alert region for the error notification', () => {
    renderWithProviders(
      <RegistrationNotification isSubmitting={false} onBack={jest.fn()} view="error" />,
      { i18nMock: createUkrainianI18n() }
    );

    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('renders the error alert without a redundant aria-live', () => {
    renderWithProviders(
      <RegistrationNotification isSubmitting={false} onBack={jest.fn()} view="error" />,
      { i18nMock: createUkrainianI18n() }
    );

    expect(screen.getByRole('alert')).not.toHaveAttribute('aria-live');
  });

  it('focuses a wrapper outside the assertive alert on mount (Gap 1)', () => {
    renderWithProviders(
      <RegistrationNotification
        isSubmitting={false}
        onBack={jest.fn()}
        onRetry={jest.fn()}
        view="error"
      />,
      { i18nMock: createUkrainianI18n() }
    );

    const heading = screen.getByRole('heading', { level: 2 });
    const alert = screen.getByRole('alert');
    const retryButton = screen.getByRole('button', { name: 'Спробувати ще раз' });

    expect(heading).toHaveAccessibleName();

    expect(document.body).not.toHaveFocus();
    expect(heading).not.toHaveFocus();
    expect(alert).not.toHaveFocus();
    screen.getAllByRole('button').forEach((button) => {
      expect(button).not.toHaveFocus();
    });

    expect(alert).not.toContainElement(heading);
    expect(alert).not.toContainElement(retryButton);
  });

  it('renders the retry button and disables it while submitting', () => {
    const onRetry = jest.fn();

    renderWithProviders(
      <RegistrationNotification isSubmitting onBack={jest.fn()} onRetry={onRetry} view="error" />,
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
