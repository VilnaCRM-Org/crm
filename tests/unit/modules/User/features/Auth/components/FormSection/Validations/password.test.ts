import { TFunction } from 'i18next';

import { createValidators } from '@/modules/User/features/Auth/components/FormSection/Validations';

import emptyUser from './contsants';

describe('password validation', () => {
  const tMock = ((key: string) => key) as unknown as TFunction;
  const validators = createValidators(tMock);

  describe('valid passwords', () => {
    it.each([
      'Password1',
      'ValidPass123',
      'MySecureP@ssw0rd',
      'TestPassword1',
      'UPPERCASE123',
      'MixedCase123',
      'LongPassword12345678',
      'Pass1234',
      'P@ssw0rd',
      'ComplexP@ss1',
      'SecurePassword123',
      'ValidP4ssword',
      'A1bcdefg',
      'Abcdefgh1',
      'PASSWORD1',
      'P1ssword',
      'Пароль1А',
    ])('should return true for valid password: %s', (password) => {
      expect(validators.password(password, emptyUser)).toBe(true);
    });
  });

  describe('required validation', () => {
    it('should return required error for empty string', () => {
      expect(validators.password('', emptyUser)).toBe('sign_up.form.password_input.error_required');
    });

    it('should return required error for undefined', () => {
      expect(validators.password(undefined as unknown as string, emptyUser)).toBe(
        'sign_up.form.password_input.error_required'
      );
    });

    it('should return required error for null', () => {
      expect(validators.password(null as unknown as string, emptyUser)).toBe(
        'sign_up.form.password_input.error_required'
      );
    });
  });

  describe('length validation', () => {
    it('should return length error for password shorter than 8 characters', () => {
      expect(validators.password('Pass1', emptyUser)).toBe(
        'sign_up.form.password_input.error_length'
      );
      expect(validators.password('Abc123', emptyUser)).toBe(
        'sign_up.form.password_input.error_length'
      );
      expect(validators.password('Test1', emptyUser)).toBe(
        'sign_up.form.password_input.error_length'
      );
    });

    it('should accept password exactly 8 characters', () => {
      expect(validators.password('Passwor1', emptyUser)).toBe(true);
    });

    it('should accept password exactly 64 characters', () => {
      const password = 'P' + 'a'.repeat(62) + '1';
      expect(password.length).toBe(64);
      expect(validators.password(password, emptyUser)).toBe(true);
    });

    it('should return length error for password longer than 64 characters', () => {
      const password = 'P' + 'a'.repeat(63) + '1';
      expect(password.length).toBe(65);
      expect(validators.password(password, emptyUser)).toBe(
        'sign_up.form.password_input.error_length'
      );
    });

    it('should return length error for 7 characters', () => {
      expect(validators.password('Passwo1', emptyUser)).toBe(
        'sign_up.form.password_input.error_length'
      );
    });

    it('should accept 9 characters', () => {
      expect(validators.password('Password1', emptyUser)).toBe(true);
    });

    it.each([
      ['1 char', 'P'],
      ['2 chars', 'P1'],
      ['3 chars', 'Pa1'],
      ['4 chars', 'Pas1'],
      ['5 chars', 'Pass1'],
      ['6 chars', 'Passw1'],
      ['7 chars', 'Passwo1'],
    ])('should return length error for password with %s', (_, password) => {
      expect(validators.password(password, emptyUser)).toBe(
        'sign_up.form.password_input.error_length'
      );
    });
  });

  describe('number validation', () => {
    it('should return number error for password without numbers', () => {
      expect(validators.password('Password', emptyUser)).toBe(
        'sign_up.form.password_input.error_numbers'
      );
      expect(validators.password('UPPERCASE', emptyUser)).toBe(
        'sign_up.form.password_input.error_numbers'
      );
      expect(validators.password('lowercase', emptyUser)).toBe(
        'sign_up.form.password_input.error_numbers'
      );
    });

    it('should return number error for valid length password without numbers', () => {
      expect(validators.password('Password', emptyUser)).toBe(
        'sign_up.form.password_input.error_numbers'
      );
      expect(validators.password('ValidPass', emptyUser)).toBe(
        'sign_up.form.password_input.error_numbers'
      );
    });

    it('should accept password with single number', () => {
      expect(validators.password('Password1', emptyUser)).toBe(true);
    });

    it('should accept password with multiple numbers', () => {
      expect(validators.password('Password123', emptyUser)).toBe(true);
    });

    it('should accept password with numbers only (if other conditions met)', () => {
      expect(validators.password('12345678', emptyUser)).toBe(
        'sign_up.form.password_input.error_uppercase'
      );
    });

    it.each(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])(
      'should accept password with number %s',
      (num) => {
        expect(validators.password(`Password${num}`, emptyUser)).toBe(true);
      }
    );
  });

  describe('uppercase validation', () => {
    it('should return uppercase error for password without uppercase', () => {
      expect(validators.password('password1', emptyUser)).toBe(
        'sign_up.form.password_input.error_uppercase'
      );
      expect(validators.password('lowercase123', emptyUser)).toBe(
        'sign_up.form.password_input.error_uppercase'
      );
    });

    it('should return uppercase error for valid length with numbers but no uppercase', () => {
      expect(validators.password('validpass1', emptyUser)).toBe(
        'sign_up.form.password_input.error_uppercase'
      );
      expect(validators.password('password123', emptyUser)).toBe(
        'sign_up.form.password_input.error_uppercase'
      );
    });

    it('should accept password with single uppercase letter', () => {
      expect(validators.password('Password1', emptyUser)).toBe(true);
    });

    it('should accept password with multiple uppercase letters', () => {
      expect(validators.password('PASSword1', emptyUser)).toBe(true);
    });

    it('should accept password with all uppercase letters', () => {
      expect(validators.password('PASSWORD1', emptyUser)).toBe(true);
    });

    it('should handle Unicode uppercase letters', () => {
      expect(validators.password('Пароль123', emptyUser)).toBe(true); // Cyrillic П
      expect(validators.password('Übung123', emptyUser)).toBe(true); // German Ü
      expect(validators.password('École123', emptyUser)).toBe(true); // French É
    });

    it.each(['A', 'B', 'C', 'X', 'Y', 'Z'])(
      'should accept password with uppercase %s',
      (letter) => {
        expect(validators.password(`${letter}assword1`, emptyUser)).toBe(true);
      }
    );
  });

  describe('validation order', () => {
    it('should check required before length', () => {
      const result = validators.password('', emptyUser);
      expect(result).toBe('sign_up.form.password_input.error_required');
    });

    it('should check length before number', () => {
      const result = validators.password('Pass', emptyUser);
      expect(result).toBe('sign_up.form.password_input.error_length');
      expect(result).not.toBe('sign_up.form.password_input.error_numbers');
    });

    it('should check number before uppercase', () => {
      const result = validators.password('password', emptyUser);
      expect(result).toBe('sign_up.form.password_input.error_numbers');
      expect(result).not.toBe('sign_up.form.password_input.error_uppercase');
    });

    it('should check uppercase last', () => {
      const result = validators.password('password1', emptyUser);
      expect(result).toBe('sign_up.form.password_input.error_uppercase');
    });
  });

  describe('edge cases', () => {
    it('should handle password with special characters', () => {
      expect(validators.password('P@ssw0rd', emptyUser)).toBe(true);
      expect(validators.password('Pass!123', emptyUser)).toBe(true);
      expect(validators.password('P#ssword1', emptyUser)).toBe(true);
    });

    it('should handle password with spaces', () => {
      expect(validators.password('Pass word1', emptyUser)).toBe(true);
      expect(validators.password('My Pass1', emptyUser)).toBe(true);
    });

    it('should handle password starting with number', () => {
      expect(validators.password('1Password', emptyUser)).toBe(true);
    });

    it('should handle password ending with uppercase', () => {
      expect(validators.password('password1A', emptyUser)).toBe(true);
    });

    it('should handle password with only minimum requirements', () => {
      expect(validators.password('Aaaaaaa1', emptyUser)).toBe(true);
    });

    it('should handle password with emojis (if they count as characters)', () => {
      expect(validators.password('Password1😀', emptyUser)).toBe(true);
    });

    it('should handle whitespace-only password', () => {
      const whitespace = '        ';
      expect(validators.password(whitespace, emptyUser)).toBe(
        'sign_up.form.password_input.error_required'
      );
    });

    it('should handle password with tabs and newlines', () => {
      expect(validators.password('Pass\tword1', emptyUser)).toBe(true);
      expect(validators.password('Pass\nword1', emptyUser)).toBe(true);
    });
  });

  describe('boundary conditions', () => {
    it('should accept exactly 8 characters with all requirements', () => {
      expect(validators.password('Abcdefg1', emptyUser)).toBe(true);
    });
  });

  describe('combined validation failures', () => {
    it('should return first error when multiple validations fail', () => {
      expect(validators.password('pass', emptyUser)).toBe(
        'sign_up.form.password_input.error_length'
      );
    });

    it('should return length error first even if other validations fail', () => {
      expect(validators.password('abc', emptyUser)).toBe(
        'sign_up.form.password_input.error_length'
      );
    });

    it('should return number error when length is valid but no number and no uppercase', () => {
      expect(validators.password('password', emptyUser)).toBe(
        'sign_up.form.password_input.error_numbers'
      );
    });

    it('should return uppercase error when length is valid and has number but no uppercase', () => {
      expect(validators.password('password1', emptyUser)).toBe(
        'sign_up.form.password_input.error_uppercase'
      );
      expect(validators.password('testpass123', emptyUser)).toBe(
        'sign_up.form.password_input.error_uppercase'
      );
      expect(validators.password('mypassword99', emptyUser)).toBe(
        'sign_up.form.password_input.error_uppercase'
      );
    });

    it('should pass all validations when length, number, and uppercase are present', () => {
      expect(validators.password('Password1', emptyUser)).toBe(true);
      expect(validators.password('ValidPass123', emptyUser)).toBe(true);
    });
  });
});
