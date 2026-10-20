import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

import Notification from '@auth/components/form-section/auth-forms/registration-notification';

import createLocaleI18n from '../../../../../../../utils/create-locale-i18n';
import renderWithProviders from '../../../../../../../utils/render-with-providers';

jest.mock('@/assets/notification/confetti.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/notification/error.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/notification/settings.svg', () => ({ ReactComponent: 'svg' }));

const SIGN_IN_ERROR = 'Невірна електронна адреса або пароль';

describe('RegistrationNotification flows', () => {
  it('shows the sign-in error text as given, not through the registration mapper', async () => {
    renderWithProviders(
      <Notification
        flow="signIn"
        view="error"
        errorText={SIGN_IN_ERROR}
        isSubmitting={false}
        onBack={jest.fn()}
        onRetry={jest.fn()}
      />,
      { i18nMock: createLocaleI18n('uk') }
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(SIGN_IN_ERROR);
  });

  it('shows an empty sign-in error when no text is given', () => {
    renderWithProviders(
      <Notification flow="signIn" view="error" isSubmitting={false} onBack={jest.fn()} />,
      { i18nMock: createLocaleI18n('uk') }
    );

    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
  });

  it('announces the sign-in request while a retry runs', () => {
    renderWithProviders(
      <Notification
        flow="signIn"
        view="error"
        errorText={SIGN_IN_ERROR}
        isSubmitting
        onBack={jest.fn()}
        onRetry={jest.fn()}
      />,
      { i18nMock: createLocaleI18n('uk') }
    );

    expect(screen.getByRole('status')).toHaveTextContent('Вхід…');
  });

  it('announces the sign-up request while a retry runs by default', () => {
    renderWithProviders(
      <Notification
        view="error"
        errorText="Invalid data provided"
        isSubmitting
        onBack={jest.fn()}
        onRetry={jest.fn()}
      />,
      { i18nMock: createLocaleI18n('uk') }
    );

    expect(screen.getByRole('status')).toHaveTextContent('Обробка…');
  });

  it('shows the sign-in success copy with Продовжити', async () => {
    renderWithProviders(
      <Notification flow="signIn" view="success" isSubmitting={false} onBack={jest.fn()} />,
      { i18nMock: createLocaleI18n('uk') }
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Вітаємо!' })).toHaveFocus();
    expect(await screen.findByRole('status')).toHaveTextContent('Ви успішно увійшли');
    expect(screen.getByRole('button', { name: 'Продовжити' })).toBeInTheDocument();
  });

  it('keeps the sign-up success copy by default', async () => {
    renderWithProviders(<Notification view="success" isSubmitting={false} onBack={jest.fn()} />, {
      i18nMock: createLocaleI18n('uk'),
    });

    expect(screen.getByRole('heading', { level: 2, name: 'Вітаємо!' })).toBeInTheDocument();
    expect(await screen.findByRole('status')).toHaveTextContent('Ви успішно зареєструвалися');
    expect(screen.getByRole('button', { name: 'Назад' })).toBeInTheDocument();
  });
});
