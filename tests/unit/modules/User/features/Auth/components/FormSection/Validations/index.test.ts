import {
  validateEmail,
  validateFullName,
  validatePassword,
} from '@/modules/User/features/Auth/components/FormSection/Validations';
import validateEmailFunc from '@/modules/User/features/Auth/components/FormSection/Validations/email';
import validateFullNameFunc from '@/modules/User/features/Auth/components/FormSection/Validations/name';
import validatePasswordFunc from '@/modules/User/features/Auth/components/FormSection/Validations/password';

import emptyUser from './contsants';

jest.mock('i18next', () => ({
  t: (key: string): string => key,
}));

describe('validations module exports', () => {
  describe('validateEmail export', () => {
    it('should export validateEmail function', () => {
      expect(validateEmail).toBeDefined();
      expect(typeof validateEmail).toBe('function');
    });

    it('should be the same as the default export from email module', () => {
      expect(validateEmail).toBe(validateEmailFunc);
    });

    it('should validate email correctly', () => {
      expect(validateEmail('user@example.com', emptyUser)).toBe(true);
      expect(validateEmail('invalid', emptyUser)).toBe('sign_up.form.email_input.invalid_message');
      expect(validateEmail('', emptyUser)).toBe('sign_up.form.email_input.required');
    });
  });

  describe('validateFullName export', () => {
    it('should export validateFullName function', () => {
      expect(validateFullName).toBeDefined();
      expect(typeof validateFullName).toBe('function');
    });

    it('should be the same as the default export from name module', () => {
      expect(validateFullName).toBe(validateFullNameFunc);
    });

    it('should validate full name correctly', () => {
      expect(validateFullName('John Doe', emptyUser)).toBe(true);
      expect(validateFullName('John', emptyUser)).toBe(
        'sign_up.form.name_input.full_name_format_error'
      );
      expect(validateFullName('', emptyUser)).toBe('sign_up.form.name_input.required');
    });
  });

  describe('validatePassword export', () => {
    it('should export validatePassword function', () => {
      expect(validatePassword).toBeDefined();
      expect(typeof validatePassword).toBe('function');
    });

    it('should be the same as the default export from password module', () => {
      expect(validatePassword).toBe(validatePasswordFunc);
    });

    it('should validate password correctly', () => {
      expect(validatePassword('Password1')).toBe(true);
      expect(validatePassword('pass')).toBe('sign_up.form.password_input.error_length');
      expect(validatePassword('')).toBe("Це поле обов'язкове");
    });
  });

  describe('integration', () => {
    it('should allow all validators to be used together', () => {
      const formData = {
        email: 'user@example.com',
        fullName: 'John Doe',
        password: 'Password1',
      };

      expect(validateEmail(formData.email, emptyUser)).toBe(true);
      expect(validateFullName(formData.fullName, emptyUser)).toBe(true);
      expect(validatePassword(formData.password)).toBe(true);
    });

    it('should return errors for invalid form data', () => {
      const formData = {
        email: 'invalid',
        fullName: 'John',
        password: 'pass',
      };

      expect(validateEmail(formData.email, emptyUser)).toBe(
        'sign_up.form.email_input.invalid_message'
      );
      expect(validateFullName(formData.fullName, emptyUser)).toBe(
        'sign_up.form.name_input.full_name_format_error'
      );
      expect(validatePassword(formData.password)).toBe('sign_up.form.password_input.error_length');
    });

    it('should handle empty form data', () => {
      const formData = {
        email: '',
        fullName: '',
        password: '',
      };

      expect(validateEmail(formData.email, emptyUser)).toBe('sign_up.form.email_input.required');
      expect(validateFullName(formData.fullName, emptyUser)).toBe(
        'sign_up.form.name_input.required'
      );
      expect(validatePassword(formData.password)).toBe("Це поле обов'язкове");
    });
  });
});
