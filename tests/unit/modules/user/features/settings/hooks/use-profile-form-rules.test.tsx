import { renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useProfileFormRules from '@/modules/user/features/settings/hooks/use-profile-form-rules';
import ProfileChangeDetector from '@/modules/user/features/settings/utils/profile-change-detector';
import { buildProfileFormValues, buildUserEntity } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

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
