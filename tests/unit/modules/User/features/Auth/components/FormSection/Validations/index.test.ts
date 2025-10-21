import { TFunction } from 'i18next';

import { createValidators } from '@/modules/User/features/Auth/components/FormSection/Validations';

import emptyUser from './contsants';

jest.mock('i18next', () => ({
  t: (key: string): string => key,
}));

describe('validations module exports', () => {
  const tMock = ((key: string) => key) as unknown as TFunction;
  const validators = createValidators(tMock);

  describe('validateEmail export', () => {
    it('should export validateEmail function', () => {
      expect(validators.email).toBeDefined();
      expect(typeof validators.email).toBe('function');
    });

    it('should validate email correctly', () => {
      expect(validators.email('user@example.com', emptyUser)).toBe(true);
      expect(validators.email('invalid', emptyUser)).toBe(
        'sign_up.form.email_input.email_format_error'
      );
      expect(validators.email('', emptyUser)).toBe('sign_up.form.email_input.required');
    });
  });

  describe('validateFullName export', () => {
    it('should export validateFullName function', () => {
      expect(validators.fullName).toBeDefined();
      expect(typeof validators.fullName).toBe('function');
    });

    it('should validate full name correctly', () => {
      expect(validators.fullName('John Doe', emptyUser)).toBe(true);
      expect(validators.fullName('John', emptyUser)).toBe(
        'sign_up.form.name_input.full_name_format_error'
      );
      expect(validators.fullName('', emptyUser)).toBe('sign_up.form.name_input.required');
    });
  });

  describe('validatePassword export', () => {
    it('should export validatePassword function', () => {
      expect(validators.password).toBeDefined();
      expect(typeof validators.password).toBe('function');
    });

    it('should validate password correctly', () => {
      expect(validators.password('Password1', emptyUser)).toBe(true);
      expect(validators.password('pass', emptyUser)).toBe(
        'sign_up.form.password_input.error_length'
      );
      expect(validators.password('', emptyUser)).toBe('sign_up.form.password_input.error_required');
    });
  });

  describe('integration', () => {
    it('should allow all validators to be used together', () => {
      const formData = {
        email: 'user@example.com',
        fullName: 'John Doe',
        password: 'Password1',
      };

      expect(validators.email(formData.email, emptyUser)).toBe(true);
      expect(validators.fullName(formData.fullName, emptyUser)).toBe(true);
      expect(validators.password(formData.password, emptyUser)).toBe(true);
    });

    it('should return errors for invalid form data', () => {
      const formData = {
        email: 'invalid',
        fullName: 'John',
        password: 'pass',
      };

      expect(validators.email(formData.email, emptyUser)).toBe(
        'sign_up.form.email_input.email_format_error'
      );
      expect(validators.fullName(formData.fullName, emptyUser)).toBe(
        'sign_up.form.name_input.full_name_format_error'
      );
      expect(validators.password(formData.password, emptyUser)).toBe(
        'sign_up.form.password_input.error_length'
      );
    });

    it('should handle empty form data', () => {
      const formData = {
        email: '',
        fullName: '',
        password: '',
      };

      expect(validators.email(formData.email, emptyUser)).toBe('sign_up.form.email_input.required');
      expect(validators.fullName(formData.fullName, emptyUser)).toBe(
        'sign_up.form.name_input.required'
      );
      expect(validators.password(formData.password, emptyUser)).toBe(
        'sign_up.form.password_input.error_required'
      );
    });
  });
});
