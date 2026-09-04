import type { TFunction } from 'i18next';

import { buildEmail, buildPassword } from '@tests/builders';

import emptyUser from './constants';

const tKey = (key: string): string => key;
const tMock = tKey as unknown as TFunction;

/**
 * `create` returns the arrow function react-hook-form calls on every keystroke. Building it
 * inside each test (rather than once at module scope) keeps that arrow under test instead of
 * letting it be constructed while the suite is still being collected.
 */
/**
 * Overlaps the email/password/name suites by design. Those exercise the module-scope
 * `formValidators.create()` singleton, whose validator objects are built when the module loads, so
 * mutants inside them are static and never reach an assertion. Calling each `create()`-returned
 * function directly, from a module loaded inside the test, is what executes them.
 */
describe('validator factories', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('emailValidator.create', () => {
    it('returns a validator that accepts a well-formed address', async () => {
      const { default: emailValidator } =
        await import('@auth/components/form-section/validations/email');
      const validate = emailValidator.create(tKey);

      expect(validate(buildEmail(), emptyUser)).toBe(true);
    });

    it('returns a validator that reports the required key for a blank address', async () => {
      const { default: emailValidator } =
        await import('@auth/components/form-section/validations/email');
      const validate = emailValidator.create(tKey);

      expect(validate('', emptyUser)).toBe('sign_up.form.email_input.required');
      expect(validate('   ', emptyUser)).toBe('sign_up.form.email_input.required');
    });

    it('returns a validator that reports the format key with no @ or dot', async () => {
      const { default: emailValidator } =
        await import('@auth/components/form-section/validations/email');
      const validate = emailValidator.create(tKey);

      expect(validate('not-an-email', emptyUser)).toBe(
        'sign_up.form.email_input.email_format_error'
      );
    });

    it('returns a validator that reports the invalid key for a malformed address', async () => {
      const { default: emailValidator } =
        await import('@auth/components/form-section/validations/email');
      const validate = emailValidator.create(tKey);

      expect(validate('user@@example.com', emptyUser)).toBe(
        'sign_up.form.email_input.invalid_message'
      );
    });

    it('returns a validator that trims before validating', async () => {
      const { default: emailValidator } =
        await import('@auth/components/form-section/validations/email');
      const validate = emailValidator.create(tKey);

      expect(validate(`  ${buildEmail()}  `, emptyUser)).toBe(true);
    });
  });

  describe('passwordValidator.create', () => {
    it('returns a validator that accepts a compliant password', async () => {
      const { default: passwordValidator } =
        await import('@auth/components/form-section/validations/password');
      const validate = passwordValidator.create(tMock);

      expect(validate(buildPassword(), emptyUser)).toBe(true);
    });

    it('returns a validator that reports the required key for a blank password', async () => {
      const { default: passwordValidator } =
        await import('@auth/components/form-section/validations/password');
      const validate = passwordValidator.create(tMock);

      expect(validate('', emptyUser)).toBe('sign_up.form.password_input.required');
      expect(validate('   ', emptyUser)).toBe('sign_up.form.password_input.required');
    });

    it('returns a validator that reports each unmet password rule', async () => {
      const { default: passwordValidator } =
        await import('@auth/components/form-section/validations/password');
      const validate = passwordValidator.create(tMock);

      expect(validate('Ab1', emptyUser)).toBe('sign_up.form.password_input.error_length');
      expect(validate('Password', emptyUser)).toBe('sign_up.form.password_input.error_numbers');
      expect(validate('password1', emptyUser)).toBe('sign_up.form.password_input.error_uppercase');
      expect(validate('PASSWORD1', emptyUser)).toBe('sign_up.form.password_input.error_lowercase');
    });
  });

  describe('fullNameValidator.create', () => {
    it('returns a validator that accepts a two-part name and rejects a single name', async () => {
      const { default: fullNameValidator } =
        await import('@auth/components/form-section/validations/name');
      const validate = fullNameValidator.create(tKey);

      expect(validate('John Doe', emptyUser)).toBe(true);
      expect(validate('John', emptyUser)).toBe('sign_up.form.name_input.full_name_format_error');
    });
  });
});
