import { faker } from '@faker-js/faker';

import type passwordValidatorInstance from '@auth/components/form-section/validations/password';
import { buildPassword } from '@tests/builders';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';
import loadIsolated from '@tests/unit/utils/isolated-module';

import emptyUser from './constants';

type PasswordValidator = typeof passwordValidatorInstance;

const UPSTREAM_PASSWORD_RULE = /^(?=.*[0-9])(?=.*[A-Z]).{8,64}$/;
const ALPHABET =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' +
  'абвгґдеєжзиіїйклмнопрстуфхцчшщьюяАБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯÜÉüé!@#$%^&* ';

const loadValidator = async (): Promise<PasswordValidator> =>
  loadIsolated(
    async () => (await import('@auth/components/form-section/validations/password')).default
  );

const randomPassword = (): string =>
  Array.from({ length: faker.number.int({ min: 1, max: 70 }) }, () =>
    faker.helpers.arrayElement([...ALPHABET])
  ).join('');

describe('the shared password policy', () => {
  let validator: PasswordValidator;

  beforeEach(async () => {
    validator = await loadValidator();
  });

  const validate = (value: string, locale: 'en' | 'uk' = 'en'): string | true => {
    const result = validator.create(createLocaleI18n(locale).t)(value, emptyUser);
    if (result instanceof Promise) throw new Error('the password validator is synchronous');
    return result as string | true;
  };

  it.each([
    ['uk', 'Будь ласка, додайте принаймні одну велику латинську літеру (A–Z)'],
    ['en', 'Please add at least one uppercase Latin letter (A–Z)'],
  ] as const)('rejects Пароль123 with the %s Latin-uppercase message', (locale, message) => {
    expect(validate('Пароль123', locale)).toBe(message);
  });

  it.each(['Password1', 'Abcdefg1'])('accepts %s', (password) => {
    expect(validate(password)).toBe(true);
  });

  it.each([
    ['password1', 'sign_up.form.password_input.error_uppercase'],
    ['PASSWORD1', 'sign_up.form.password_input.error_lowercase'],
    ['Passwordd', 'sign_up.form.password_input.error_numbers'],
    ['Abcdef1', 'sign_up.form.password_input.error_length'],
    [`Abcdef1${'a'.repeat(58)}`, 'sign_up.form.password_input.error_length'],
  ])('maps %s to %s', (password, key) => {
    const i18n = createLocaleI18n('en');

    expect(validate(password)).toBe(i18n.t(key));
  });

  it('never accepts a value the upstream rule rejects', () => {
    const fixed = ['Password1', 'Abcdefg1', 'Пароль123', 'password1', 'PASSWORD1', 'Abcdef1'];
    const generated = Array.from({ length: 2000 }, randomPassword);
    const accepted = [...fixed, ...generated].filter((value) => validate(value) === true);

    expect(accepted.length).toBeGreaterThan(fixed.length);
    expect(accepted.filter((value) => !UPSTREAM_PASSWORD_RULE.test(value))).toEqual([]);
  });

  it('accepts the seeded builder password', () => {
    expect(validate(buildPassword())).toBe(true);
  });

  it('evaluates every rule in policy order', () => {
    expect(validator.evaluate('Pa1')).toEqual({
      items: [
        { key: 'invalidLength', met: false },
        { key: 'numberRequired', met: true },
        { key: 'uppercaseRequired', met: true },
        { key: 'lowercaseRequired', met: true },
      ],
    });
  });

  it('evaluates against the same rules create(t) enforces', () => {
    expect(validator.evaluate('password1').items).toEqual([
      { key: 'invalidLength', met: true },
      { key: 'numberRequired', met: true },
      { key: 'uppercaseRequired', met: false },
      { key: 'lowercaseRequired', met: true },
    ]);
    expect(validator.evaluate('Пароль123').items[2]).toEqual({
      key: 'uppercaseRequired',
      met: false,
    });
    expect(validator.evaluate('').items.every((item) => item.met)).toBe(false);
  });
});
