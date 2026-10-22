import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX, ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { I18nextProvider } from 'react-i18next';

import type { PasswordRuleEvaluator } from '@/components/types/ui-password-policy-rules';
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

const evaluate: PasswordRuleEvaluator = (value) => passwordValidator.evaluate(value);

const subject = (busy = false): JSX.Element => (
  <ChangePassword
    rules={{ currentPassword: {}, newPassword: {} }}
    evaluate={evaluate}
    busy={busy}
  />
);

jest.mock('@/i18n', () => ({ __esModule: true, default: { addResourceBundle: jest.fn() } }));

const HIDDEN = { position: 'absolute', width: '1px', height: '1px' };

const mountSection = (): ReturnType<typeof userEvent.setup> => {
  render(subject(), {
    wrapper: ({ children }) => (
      <Provider i18n={createSettingsLocaleI18n('uk')}>{children}</Provider>
    ),
  });
  return userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
};

const advance = (ms: number): void => {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
};

describe('ChangePassword rule list at rest', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps the rules and the hint out of sight until the new password is used', () => {
    mountSection();

    expect(screen.getByRole('list')).toHaveStyle(HIDDEN);
    expect(
      screen.getByText('Необов’язково. Залиште порожнім, щоб не змінювати пароль.')
    ).toHaveStyle(HIDDEN);
  });

  it('shows the rules while the empty new password has focus, then for 200 ms after', async () => {
    const user = mountSection();

    await user.click(screen.getByLabelText('Новий пароль'));

    expect(screen.getByRole('list')).not.toHaveStyle(HIDDEN);

    await user.tab();
    await user.tab();

    expect(screen.getByLabelText('Новий пароль')).not.toHaveFocus();
    expect(screen.getByRole('list')).not.toHaveStyle(HIDDEN);

    advance(199);

    expect(screen.getByRole('list')).not.toHaveStyle(HIDDEN);

    advance(1);

    expect(screen.getByRole('list')).toHaveStyle(HIDDEN);
  });

  it('starts the hold only when the new password loses focus while empty', async () => {
    const user = mountSection();

    await user.type(screen.getByLabelText('Новий пароль'), 'a');
    await user.tab();
    await user.tab();

    expect(jest.getTimerCount()).toBe(0);

    await user.clear(screen.getByLabelText('Новий пароль'));
    await user.tab();
    await user.tab();

    expect(jest.getTimerCount()).toBeGreaterThan(0);
  });

  it('keeps the rules in sight once the new password holds a value, focused or not', async () => {
    const user = mountSection();

    await user.type(screen.getByLabelText('Новий пароль'), 'a');
    await user.tab();
    await user.tab();
    advance(200);

    expect(screen.getByLabelText('Новий пароль')).not.toHaveFocus();
    expect(screen.getByRole('list')).not.toHaveStyle(HIDDEN);

    await user.clear(screen.getByLabelText('Новий пароль'));
    await user.tab();
    await user.tab();
    advance(200);

    expect(screen.getByRole('list')).toHaveStyle(HIDDEN);
  });
});

describe('ChangePassword', () => {
  it('renders the section heading, both fields and the hint in Ukrainian', () => {
    render(<Provider i18n={createSettingsLocaleI18n('uk')}>{subject()}</Provider>);

    expect(screen.getByRole('heading', { level: 2, name: 'Пароль' })).toBeInTheDocument();
    expect(screen.getByLabelText('Поточний пароль')).toHaveAttribute(
      'autocomplete',
      'current-password'
    );
    expect(screen.getByLabelText('Новий пароль')).toHaveAttribute('autocomplete', 'new-password');
    expect(screen.getByLabelText('Поточний пароль')).toHaveAttribute(
      'placeholder',
      'Введіть пароль'
    );
    expect(screen.getByLabelText('Новий пароль')).toHaveAttribute('placeholder', 'Створіть пароль');
    expect(
      screen.getByText('Необов’язково. Залиште порожнім, щоб не змінювати пароль.')
    ).toBeInTheDocument();
  });

  it('describes the new password by the hint and the rule list, the current one by neither', () => {
    render(<Provider i18n={createSettingsLocaleI18n('uk')}>{subject()}</Provider>);

    const describedBy =
      screen.getByLabelText('Новий пароль').getAttribute('aria-describedby') ?? '';

    expect(describedBy.split(' ')).toEqual(
      expect.arrayContaining(['new-password-hint', 'new-password-rules'])
    );
    expect(
      screen.getByText('Необов’язково. Залиште порожнім, щоб не змінювати пароль.')
    ).toHaveAttribute('id', 'new-password-hint');
    expect(screen.getByRole('list')).toHaveAttribute('id', 'new-password-rules');
    expect(screen.getByLabelText('Поточний пароль')).not.toHaveAttribute('aria-describedby');
  });

  it('makes both password fields read-only, and only them, while busy', async () => {
    const view = render(<Provider i18n={createSettingsLocaleI18n('uk')}>{subject(true)}</Provider>);

    expect(screen.getByLabelText('Поточний пароль')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Новий пароль')).toHaveAttribute('readonly');
    await userEvent.type(screen.getByLabelText('Новий пароль'), 'Next12345');
    expect(screen.getByLabelText('Новий пароль')).toHaveValue('');
    expect(screen.getByLabelText('Новий пароль')).toHaveFocus();

    view.rerender(<Provider i18n={createSettingsLocaleI18n('uk')}>{subject(false)}</Provider>);

    expect(screen.getByLabelText('Поточний пароль')).not.toHaveAttribute('readonly');
    expect(screen.getByLabelText('Новий пароль')).not.toHaveAttribute('readonly');
  });

  it('renders the four policy rules and their met or unmet words translated in uk', () => {
    render(<Provider i18n={createSettingsLocaleI18n('uk')}>{subject()}</Provider>);

    const items = screen.getAllByRole('listitem');

    expect(items).toHaveLength(4);
    items.forEach((item) => expect(item).not.toHaveTextContent(/password_policy\./));
    expect(items[0]).toHaveTextContent('Від 8 до 64 символів');
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
