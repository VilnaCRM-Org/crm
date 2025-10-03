import validatePassword from '@/modules/User/features/Auth/components/FormSection/Validations/password';

jest.mock('i18next', () => ({
  t: (key: string): string => key,
}));

describe('password validation', () => {
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
      expect(validatePassword(password)).toBe(true);
    });
  });

  describe('required validation', () => {
    it('should return required error for empty string', () => {
      expect(validatePassword('')).toBe("Це поле обов'язкове");
    });

    it('should return required error for undefined', () => {
      expect(validatePassword(undefined as unknown as string)).toBe("Це поле обов'язкове");
    });

    it('should return required error for null', () => {
      expect(validatePassword(null as unknown as string)).toBe("Це поле обов'язкове");
    });
  });

  describe('length validation', () => {
    it('should return length error for password shorter than 8 characters', () => {
      expect(validatePassword('Pass1')).toBe('sign_up.form.password_input.error_length');
      expect(validatePassword('Abc123')).toBe('sign_up.form.password_input.error_length');
      expect(validatePassword('Test1')).toBe('sign_up.form.password_input.error_length');
    });

    it('should accept password exactly 8 characters', () => {
      expect(validatePassword('Passwor1')).toBe(true);
    });

    it('should accept password exactly 64 characters', () => {
      const password = 'P' + 'a'.repeat(62) + '1';
      expect(password.length).toBe(64);
      expect(validatePassword(password)).toBe(true);
    });

    it('should return length error for password longer than 64 characters', () => {
      const password = 'P' + 'a'.repeat(63) + '1';
      expect(password.length).toBe(65);
      expect(validatePassword(password)).toBe('sign_up.form.password_input.error_length');
    });

    it('should return length error for 7 characters', () => {
      expect(validatePassword('Passwo1')).toBe('sign_up.form.password_input.error_length');
    });

    it('should accept 9 characters', () => {
      expect(validatePassword('Password1')).toBe(true);
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
      expect(validatePassword(password)).toBe('sign_up.form.password_input.error_length');
    });
  });

  describe('number validation', () => {
    it('should return number error for password without numbers', () => {
      expect(validatePassword('Password')).toBe('sign_up.form.password_input.error_numbers');
      expect(validatePassword('UPPERCASE')).toBe('sign_up.form.password_input.error_numbers');
      expect(validatePassword('lowercase')).toBe('sign_up.form.password_input.error_numbers');
    });

    it('should return number error for valid length password without numbers', () => {
      expect(validatePassword('Password')).toBe('sign_up.form.password_input.error_numbers');
      expect(validatePassword('ValidPass')).toBe('sign_up.form.password_input.error_numbers');
    });

    it('should accept password with single number', () => {
      expect(validatePassword('Password1')).toBe(true);
    });

    it('should accept password with multiple numbers', () => {
      expect(validatePassword('Password123')).toBe(true);
    });

    it('should accept password with numbers only (if other conditions met)', () => {
      expect(validatePassword('12345678')).toBe('sign_up.form.password_input.error_uppercase');
    });

    it.each(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])(
      'should accept password with number %s',
      (num) => {
        expect(validatePassword(`Password${num}`)).toBe(true);
      }
    );
  });

  describe('uppercase validation', () => {
    it('should return uppercase error for password without uppercase', () => {
      expect(validatePassword('password1')).toBe('sign_up.form.password_input.error_uppercase');
      expect(validatePassword('lowercase123')).toBe('sign_up.form.password_input.error_uppercase');
    });

    it('should return uppercase error for valid length with numbers but no uppercase', () => {
      expect(validatePassword('validpass1')).toBe('sign_up.form.password_input.error_uppercase');
      expect(validatePassword('password123')).toBe('sign_up.form.password_input.error_uppercase');
    });

    it('should accept password with single uppercase letter', () => {
      expect(validatePassword('Password1')).toBe(true);
    });

    it('should accept password with multiple uppercase letters', () => {
      expect(validatePassword('PASSword1')).toBe(true);
    });

    it('should accept password with all uppercase letters', () => {
      expect(validatePassword('PASSWORD1')).toBe(true);
    });

    it('should handle Unicode uppercase letters', () => {
      expect(validatePassword('Пароль123')).toBe(true); // Cyrillic П
      expect(validatePassword('Übung123')).toBe(true); // German Ü
      expect(validatePassword('École123')).toBe(true); // French É
    });

    it.each(['A', 'B', 'C', 'X', 'Y', 'Z'])(
      'should accept password with uppercase %s',
      (letter) => {
        expect(validatePassword(`${letter}assword1`)).toBe(true);
      }
    );
  });

  describe('validation order', () => {
    it('should check required before length', () => {
      const result = validatePassword('');
      expect(result).toBe("Це поле обов'язкове");
    });

    it('should check length before number', () => {
      const result = validatePassword('Pass');
      expect(result).toBe('sign_up.form.password_input.error_length');
      expect(result).not.toBe('sign_up.form.password_input.error_numbers');
    });

    it('should check number before uppercase', () => {
      const result = validatePassword('password');
      expect(result).toBe('sign_up.form.password_input.error_numbers');
      expect(result).not.toBe('sign_up.form.password_input.error_uppercase');
    });

    it('should check uppercase last', () => {
      const result = validatePassword('password1');
      expect(result).toBe('sign_up.form.password_input.error_uppercase');
    });
  });

  describe('edge cases', () => {
    it('should handle password with special characters', () => {
      expect(validatePassword('P@ssw0rd')).toBe(true);
      expect(validatePassword('Pass!123')).toBe(true);
      expect(validatePassword('P#ssword1')).toBe(true);
    });

    it('should handle password with spaces', () => {
      expect(validatePassword('Pass word1')).toBe(true);
      expect(validatePassword('My Pass1')).toBe(true);
    });

    it('should handle password starting with number', () => {
      expect(validatePassword('1Password')).toBe(true);
    });

    it('should handle password ending with uppercase', () => {
      expect(validatePassword('password1A')).toBe(true);
    });

    it('should handle password with only minimum requirements', () => {
      expect(validatePassword('Aaaaaaa1')).toBe(true);
    });

    it('should handle password with emojis (if they count as characters)', () => {
      expect(validatePassword('Password1😀')).toBe(true);
    });

    it('should handle whitespace-only password', () => {
      const whitespace = '        ';
      expect(validatePassword(whitespace)).toBe('sign_up.form.password_input.error_numbers');
    });

    it('should handle password with tabs and newlines', () => {
      expect(validatePassword('Pass\tword1')).toBe(true);
      expect(validatePassword('Pass\nword1')).toBe(true);
    });
  });

  describe('boundary conditions', () => {
    it('should accept exactly 8 characters with all requirements', () => {
      expect(validatePassword('Abcdefg1')).toBe(true);
    });

    it('should accept exactly 64 characters with all requirements', () => {
      const password = 'A' + 'b'.repeat(62) + '1';
      expect(password.length).toBe(64);
      expect(validatePassword(password)).toBe(true);
    });

    it('should reject 65 characters even with all requirements', () => {
      const password = 'A' + 'b'.repeat(63) + '1';
      expect(password.length).toBe(65);
      expect(validatePassword(password)).toBe('sign_up.form.password_input.error_length');
    });

    it('should reject 7 characters even with all requirements', () => {
      expect(validatePassword('Abcdef1')).toBe('sign_up.form.password_input.error_length');
    });
  });

  describe('combined validation failures', () => {
    it('should return first error when multiple validations fail', () => {
      // Too short + no number + no uppercase
      expect(validatePassword('pass')).toBe('sign_up.form.password_input.error_length');
    });

    it('should return length error first even if other validations fail', () => {
      expect(validatePassword('abc')).toBe('sign_up.form.password_input.error_length');
    });

    it('should return number error when length is valid but no number and no uppercase', () => {
      expect(validatePassword('password')).toBe('sign_up.form.password_input.error_numbers');
    });
  });
});
