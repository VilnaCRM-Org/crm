import validateEmail, {
  isValidEmailFormat,
} from '@/modules/User/features/Auth/components/FormSection/Validations/email';

import emptyUser from './contsants';

jest.mock('i18next', () => ({
  t: (key: string): string => key,
}));

describe('email validation', () => {
  describe('isValidEmailFormat', () => {
    describe('valid emails', () => {
      it.each([
        'user@example.com',
        'test@test.com',
        'john.doe@example.com',
        'user123@example.com',
        'user@sub.domain.com',
        'user@example.co.uk',
        'a@b.co',
        'user_name@example.com',
        'user-name@example.com',
        'user.name@example.com',
        'user%test@example.com',
        'user@example-domain.com',
        '123@example.com',
        'user@123.com',
      ])('should return true for valid email: %s', (email) => {
        expect(isValidEmailFormat(email)).toBe(true);
      });
    });

    describe('invalid emails', () => {
      it.each([
        'invalid',
        'invalid@',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        '.user@example.com',
        'user.@example.com',
        'user@.example.com',
        'user@example..com',
        'user@example.com.',
        'user@@example.com',
        'user@example@com',
        '',
        ' ',
        'user@example.c',
        'user@-example.com',
        'user@example-.com',
        '-user@example.com',
        'user-@example.com',
        'user@exam ple.com',
        'user name@example.com',
      ])('should return false for invalid email: %s', (email) => {
        expect(isValidEmailFormat(email)).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle email with multiple dots in local part', () => {
        expect(isValidEmailFormat('first.middle.last@example.com')).toBe(true);
      });

      it('should handle email with numbers', () => {
        expect(isValidEmailFormat('user123@example456.com')).toBe(true);
      });

      it('should handle email with subdomain', () => {
        expect(isValidEmailFormat('user@mail.example.com')).toBe(true);
      });

      it('should handle email with hyphen', () => {
        expect(isValidEmailFormat('user-name@example-domain.com')).toBe(true);
      });

      it('should reject email starting with dot in local part', () => {
        expect(isValidEmailFormat('.user@example.com')).toBe(false);
      });

      it('should reject email ending with dot in local part', () => {
        expect(isValidEmailFormat('user.@example.com')).toBe(false);
      });

      it('should allow consecutive dots in local part (regex allows it)', () => {
        // Note: The regex actually allows this pattern
        expect(isValidEmailFormat('user..name@example.com')).toBe(true);
      });

      it('should reject email with space', () => {
        expect(isValidEmailFormat('user name@example.com')).toBe(false);
      });

      it('should reject email without @', () => {
        expect(isValidEmailFormat('userexample.com')).toBe(false);
      });

      it('should reject email without domain', () => {
        expect(isValidEmailFormat('user@')).toBe(false);
      });

      it('should reject email without TLD', () => {
        expect(isValidEmailFormat('user@example')).toBe(false);
      });

      it('should reject email with single character TLD', () => {
        expect(isValidEmailFormat('user@example.c')).toBe(false);
      });
    });
  });

  describe('validateEmail', () => {
    describe('valid emails', () => {
      it('should return true for valid email', () => {
        expect(validateEmail('user@example.com', emptyUser)).toBe(true);
      });

      it.each(['test@test.com', 'first.last@sub.domain.com', 'user123@example456.com'])(
        'should return true for valid email: %s',
        (email) => {
          expect(validateEmail(email, emptyUser)).toBe(true);
        }
      );
    });

    describe('invalid emails', () => {
      it('should return error message for invalid email', () => {
        const result = validateEmail('invalid', emptyUser);
        expect(result).toBe('sign_up.form.email_input.invalid_message');
      });

      it.each(['invalid@', '@example.com', 'user@', 'user @example.com', 'user@example'])(
        'should return error message for invalid email: %s',
        (email) => {
          expect(validateEmail(email, emptyUser)).toBe('sign_up.form.email_input.invalid_message');
        }
      );
    });

    describe('empty email', () => {
      it('should return required error for empty string', () => {
        expect(validateEmail('', emptyUser)).toBe('sign_up.form.email_input.required');
      });

      it('should return required error for undefined', () => {
        expect(validateEmail(undefined as unknown as string, emptyUser)).toBe(
          'sign_up.form.email_input.required'
        );
      });

      it('should return required error for null', () => {
        expect(validateEmail(null as unknown as string, emptyUser)).toBe(
          'sign_up.form.email_input.required'
        );
      });
    });

    describe('validation order', () => {
      it('should check required before format', () => {
        const result = validateEmail('', emptyUser);
        expect(result).toBe('sign_up.form.email_input.required');
        expect(result).not.toBe('sign_up.form.email_input.invalid_message');
      });

      it('should check format after required', () => {
        const result = validateEmail('invalid', emptyUser);
        expect(result).toBe('sign_up.form.email_input.invalid_message');
      });
    });

    describe('edge cases', () => {
      it('should handle whitespace-only email', () => {
        expect(validateEmail('   ', emptyUser)).toBe('sign_up.form.email_input.invalid_message');
      });

      it('should handle email with leading/trailing spaces', () => {
        // Note: The validator doesn't trim, so spaces make it invalid
        expect(validateEmail(' user@example.com ', emptyUser)).toBe(
          'sign_up.form.email_input.invalid_message'
        );
      });

      it('should handle very long email', () => {
        const longLocalPart = 'a'.repeat(100);
        const email = `${longLocalPart}@example.com`;
        // Should still validate based on format
        expect(validateEmail(email, emptyUser)).toBe(true);
      });
    });
  });
});
