import { screen } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import localization from '@/i18n/localization.json';
import RegistrationNotification from '@/modules/User/features/Auth/components/FormSection/AuthForms/registration-notification';

import renderWithProviders from '../../../../../../../utils/renderWithProviders';

jest.mock('@/assets/notification/confetti.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/notification/error.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/notification/settings.svg', () => ({ ReactComponent: 'svg' }));

const createUkrainianI18n = () => {
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

  it('shows the Ukrainian registration error for the English validation fallback', () => {
    renderWithProviders(
      <RegistrationNotification {...baseProps} errorText="Invalid data provided" />,
      { i18nMock: createUkrainianI18n() }
    );

    expect(screen.getByText('Помилка реєстрації. Спробуйте пізніше')).toBeInTheDocument();
  });

  it('keeps custom backend error text when it is not the generic validation fallback', () => {
    renderWithProviders(
      <RegistrationNotification {...baseProps} errorText="Custom backend error" />,
      { i18nMock: createUkrainianI18n() }
    );

    expect(screen.getByText('Custom backend error')).toBeInTheDocument();
  });

  it('falls back to the default localized error when no error text is provided', () => {
    renderWithProviders(<RegistrationNotification {...baseProps} />, {
      i18nMock: createUkrainianI18n(),
    });

    expect(
      screen.getByText("Щось пішло не так із запитом. Спробуйте ще раз пізніше")
    ).toBeInTheDocument();
  });
});
