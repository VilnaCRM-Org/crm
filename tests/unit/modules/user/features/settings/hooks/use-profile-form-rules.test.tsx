import '@testing-library/jest-dom';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX, ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { I18nextProvider } from 'react-i18next';

import ChangePassword from '@/modules/user/features/settings/components/change-password';
import useProfileFormRules from '@/modules/user/features/settings/hooks/use-profile-form-rules';
import type { ProfileFormValues } from '@/modules/user/features/settings/types/user-profile';
import ProfileChangeDetector from '@/modules/user/features/settings/utils/profile-change-detector';
import { buildProfileFormValues, buildUserEntity } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

jest.mock('@/i18n', () => ({ __esModule: true, default: { addResourceBundle: jest.fn() } }));

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk')}>{children}</I18nextProvider>
);

const user = buildUserEntity({ fullName: 'admin', email: 'admin@example.com' });

const changes = new ProfileChangeDetector();

const rules = (): ReturnType<typeof useProfileFormRules> =>
  renderHook(() => useProfileFormRules(user, changes), { wrapper }).result.current;

const values = (overrides = {}): ReturnType<typeof buildProfileFormValues> =>
  buildProfileFormValues({
    fullName: user.fullName,
    email: user.email,
    newPassword: '',
    ...overrides,
  });

type Validate = (value: string, form: ReturnType<typeof values>) => string | boolean;

const run = (rule: { validate?: unknown }, value: string, form = values()): string | boolean =>
  (rule.validate as Validate)(value, form);

const SAME_AS_CURRENT = 'Новий пароль має відрізнятися від поточного';

function PasswordSection(): JSX.Element {
  const methods = useForm<ProfileFormValues>({
    defaultValues: values({ currentPassword: '' }),
    mode: 'onTouched',
  });
  const formRules = useProfileFormRules(user, changes);

  return (
    <FormProvider {...methods}>
      <ChangePassword rules={formRules} evaluate={formRules.evaluate} busy={false} />
    </FormProvider>
  );
}

describe('useProfileFormRules', () => {
  it('skips the name rule while the name is unchanged, even for a legacy value', () => {
    expect(run(rules().fullName, 'admin')).toBe(true);
    expect(run(rules().fullName, '  admin  ')).toBe(true);
  });

  it('runs the name rule once the name changed', () => {
    expect(run(rules().fullName, 'Олена')).toBe(
      'Будь ласка, введіть повне ім’я у правильному форматі'
    );
    expect(run(rules().fullName, 'Олена Іванівна')).toBe(true);
  });

  it('accepts an edited name written with either typographic apostrophe', () => {
    expect(run(rules().fullName, 'Мар’яна Коваль')).toBe(true);
    expect(run(rules().fullName, 'Марʼяна Коваль')).toBe(true);
    expect(run(rules().fullName, 'Мар‘яна Коваль')).toBe('Будь ласка, використовуйте лише літери');
  });

  it('skips the e-mail rule while the e-mail is unchanged and runs it after a change', () => {
    expect(run(rules().email, 'ADMIN@example.com')).toBe(true);
    expect(run(rules().email, 'not-an-email')).not.toBe(true);
    expect(run(rules().email, 'other@example.com')).toBe(true);
  });

  it('requires the current password only while a change exists', () => {
    const changed = values({ fullName: 'Олена Іванівна' });

    expect(run(rules().currentPassword, '', changed)).toBe("Це поле обов'язкове");
    expect(run(rules().currentPassword, '', values())).toBe(true);
    expect(run(rules().currentPassword, 'abc', changed)).toBe(true);
  });

  it('treats a new password as optional and checks a typed one against the policy', () => {
    expect(run(rules().newPassword, '')).toBe(true);
    expect(run(rules().newPassword, 'Pa1')).toBe('Будь ласка, введіть від 8 до 64 символів');
    expect(run(rules().newPassword, 'Пароль123')).toBe(
      'Будь ласка, додайте принаймні одну велику латинську літеру (A–Z)'
    );
    expect(run(rules().newPassword, 'Password123')).toBe(true);
  });

  it('refuses a new password that repeats the current one, once the policy passes', () => {
    const current = values({ currentPassword: 'Password123' });

    expect(run(rules().newPassword, 'Password123', current)).toBe(
      'Новий пароль має відрізнятися від поточного'
    );
    expect(run(rules().newPassword, 'Password124', current)).toBe(true);
    expect(run(rules().newPassword, ' Password123', current)).toBe(true);
    expect(run(rules().newPassword, 'Pa1', values({ currentPassword: 'Pa1' }))).toBe(
      'Будь ласка, введіть від 8 до 64 символів'
    );
  });

  it('re-validates the new password whenever the current one changes', () => {
    expect(rules().currentPassword.deps).toEqual(['newPassword']);
  });

  it('clears the "same as current" error once the current password is edited', async () => {
    const typist = userEvent.setup();
    render(<PasswordSection />, { wrapper });

    await typist.type(screen.getByLabelText('Поточний пароль'), 'Password123');
    await typist.tab();
    await typist.type(screen.getByLabelText('Новий пароль'), 'Password123');
    await typist.tab();

    expect(await screen.findByText(SAME_AS_CURRENT)).toBeInTheDocument();

    await typist.type(screen.getByLabelText('Поточний пароль'), '4');

    await waitFor(() => expect(screen.queryByText(SAME_AS_CURRENT)).not.toBeInTheDocument());
    expect(screen.getByLabelText('Поточний пароль')).toHaveValue('Password1234');
  });

  it('treats a whitespace-only new password as left empty, never as required', () => {
    expect(run(rules().newPassword, ' ')).toBe(true);
    expect(run(rules().newPassword, '   ')).toBe(true);
    expect(run(rules().newPassword, ' a ')).toBe('Будь ласка, введіть від 8 до 64 символів');
  });

  it('evaluates the policy rules unchanged', () => {
    const { evaluate } = rules();

    expect(evaluate('Pa1').items.map((item) => item.met)).toEqual([false, true, true, true]);
  });

  it('reads the user it was given', () => {
    const other = buildUserEntity({ fullName: 'Олена Петренко' });
    const result = renderHook(() => useProfileFormRules(other, changes), { wrapper }).result
      .current;

    expect(run(result.fullName, 'Олена Петренко')).toBe(true);
    expect(run(result.fullName, 'admin')).not.toBe(true);
  });
});
