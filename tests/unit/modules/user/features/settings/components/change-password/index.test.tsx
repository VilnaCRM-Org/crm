import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { I18nextProvider } from 'react-i18next';

import ChangePassword from '@/modules/user/features/settings/components/change-password';
import type { ProfileFormValues } from '@/modules/user/features/settings/types/user-profile';
import passwordValidator from '@/modules/user/lib/validations/password';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

const VALUES: ProfileFormValues = {
  fullName: 'Олена Петренко',
  email: 'olena@example.com',
  currentPassword: '',
  newPassword: '',
};

function Frame({ children }: { children: ReactNode }): JSX.Element {
  const methods = useForm<ProfileFormValues>({ defaultValues: VALUES });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

interface ProviderProps {
  i18n: ReturnType<typeof createLocaleI18n>;
  children: ReactNode;
}

function Provider({ i18n, children }: ProviderProps): JSX.Element {
  return (
    <I18nextProvider i18n={i18n}>
      <Frame>{children}</Frame>
    </I18nextProvider>
  );
}

const subject = (): JSX.Element => (
  <ChangePassword
    rules={{ currentPassword: {}, newPassword: {} }}
    evaluate={(value) => passwordValidator.evaluate(value)}
  />
);

jest.mock('@/i18n', () => ({ __esModule: true, default: { addResourceBundle: jest.fn() } }));

describe('ChangePassword', () => {
  it('renders the section heading, both fields and the hint in Ukrainian', () => {
    render(<Provider i18n={createSettingsLocaleI18n('uk')}>{subject()}</Provider>);

    expect(screen.getByRole('heading', { level: 2, name: 'Пароль' })).toBeInTheDocument();
    expect(screen.getByLabelText('Поточний пароль')).toHaveAttribute(
      'autocomplete',
      'current-password'
    );
    expect(screen.getByLabelText('Новий пароль')).toHaveAttribute('autocomplete', 'new-password');
    expect(
      screen.getByText('Необов’язково. Залиште порожнім, щоб не змінювати пароль.')
    ).toBeInTheDocument();
  });

  it('renders the four policy rules and their met or unmet words translated in uk', () => {
    render(<Provider i18n={createSettingsLocaleI18n('uk')}>{subject()}</Provider>);

    const items = screen.getAllByRole('listitem');

    expect(items).toHaveLength(4);
    items.forEach((item) => expect(item).not.toHaveTextContent(/password_policy\./));
    expect(items[0]).toHaveTextContent(/8|символ/i);
  });

  it('renders the same rules and the section copy in English', async () => {
    const i18n = createSettingsLocaleI18n('uk', ['en']);
    await i18n.changeLanguage('en');
    render(<Provider i18n={i18n}>{subject()}</Provider>);

    expect(screen.getByRole('heading', { level: 2, name: 'Password' })).toBeInTheDocument();
    expect(screen.getByLabelText('Current password')).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toBeInTheDocument();
    screen
      .getAllByRole('listitem')
      .forEach((item) => expect(item).not.toHaveTextContent(/password_policy\./));
  });

  it('renders the raw policy keys when the policy catalog loader is missing', () => {
    render(<Provider i18n={createLocaleI18n('uk')}>{subject()}</Provider>);

    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent(/password_policy\./);
  });
});
