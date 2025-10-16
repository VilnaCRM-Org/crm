import getRegistrationError, {
  EMAIL_ALREADY_USED_KEY,
  GENERIC_SIGNUP_ERROR_KEY,
} from '@/modules/User/features/Auth/utils/mapRegistrationError';

describe('mapRegistrationError', () => {
  describe('EMAIL_ALREADY_USED_KEY constant', () => {
    it('should have correct value', () => {
      expect(EMAIL_ALREADY_USED_KEY).toBe('sign_up.errors.email_used');
    });
  });

  describe('GENERIC_SIGNUP_ERROR_KEY constant', () => {
    it('should have correct value', () => {
      expect(GENERIC_SIGNUP_ERROR_KEY).toBe('sign_up.errors.signup_error');
    });
  });

  describe('getRegistrationError', () => {
    describe('email already exists errors', () => {
      it('should return EMAIL_ALREADY_USED_KEY for error with "email" and "exists"', () => {
        expect(getRegistrationError('Email already exists')).toBe(EMAIL_ALREADY_USED_KEY);
      });

      it('should return EMAIL_ALREADY_USED_KEY for error with "email" and "exists" (case insensitive)', () => {
        expect(getRegistrationError('EMAIL ALREADY EXISTS')).toBe(EMAIL_ALREADY_USED_KEY);
        expect(getRegistrationError('Email Already Exists')).toBe(EMAIL_ALREADY_USED_KEY);
        expect(getRegistrationError('email already exists')).toBe(EMAIL_ALREADY_USED_KEY);
      });

      it('should return EMAIL_ALREADY_USED_KEY for error with both keywords in any order', () => {
        expect(getRegistrationError('Exists email')).toBe(EMAIL_ALREADY_USED_KEY);
        expect(getRegistrationError('This email exists in system')).toBe(EMAIL_ALREADY_USED_KEY);
      });

      it('should return EMAIL_ALREADY_USED_KEY for error with keywords separated by other words', () => {
        expect(getRegistrationError('The email address already exists in our database')).toBe(
          EMAIL_ALREADY_USED_KEY
        );
        expect(getRegistrationError('User with this email exists')).toBe(EMAIL_ALREADY_USED_KEY);
      });

      it('should return EMAIL_ALREADY_USED_KEY for error with mixed case', () => {
        expect(getRegistrationError('EmAiL aLrEaDy ExIsTs')).toBe(EMAIL_ALREADY_USED_KEY);
      });

      it('should return EMAIL_ALREADY_USED_KEY for error with extra whitespace', () => {
        expect(getRegistrationError('  email   already   exists  ')).toBe(EMAIL_ALREADY_USED_KEY);
      });
    });

    describe('generic errors', () => {
      it('should return GENERIC_SIGNUP_ERROR_KEY for error without both keywords', () => {
        expect(getRegistrationError('Something went wrong')).toBe(GENERIC_SIGNUP_ERROR_KEY);
      });

      it('should return GENERIC_SIGNUP_ERROR_KEY for error with only "email" keyword', () => {
        expect(getRegistrationError('Invalid email format')).toBe(GENERIC_SIGNUP_ERROR_KEY);
      });

      it('should return GENERIC_SIGNUP_ERROR_KEY for error with only "exists" keyword', () => {
        expect(getRegistrationError('User already exists')).toBe(GENERIC_SIGNUP_ERROR_KEY);
      });

      it('should return GENERIC_SIGNUP_ERROR_KEY for network errors', () => {
        expect(getRegistrationError('Network error')).toBe(GENERIC_SIGNUP_ERROR_KEY);
        expect(getRegistrationError('Connection timeout')).toBe(GENERIC_SIGNUP_ERROR_KEY);
      });

      it('should return GENERIC_SIGNUP_ERROR_KEY for validation errors', () => {
        expect(getRegistrationError('Validation failed')).toBe(GENERIC_SIGNUP_ERROR_KEY);
        expect(getRegistrationError('Password too weak')).toBe(GENERIC_SIGNUP_ERROR_KEY);
      });

      it('should return GENERIC_SIGNUP_ERROR_KEY for server errors', () => {
        expect(getRegistrationError('Internal server error')).toBe(GENERIC_SIGNUP_ERROR_KEY);
        expect(getRegistrationError('500 Internal Server Error')).toBe(GENERIC_SIGNUP_ERROR_KEY);
      });

      it('should return null for empty string', () => {
        expect(getRegistrationError('')).toBe(null);
      });

      it('should return GENERIC_SIGNUP_ERROR_KEY for random text', () => {
        expect(getRegistrationError('Random error message')).toBe(GENERIC_SIGNUP_ERROR_KEY);
      });
    });

    describe('null and undefined handling', () => {
      it('should return null for null input', () => {
        expect(getRegistrationError(null)).toBe(null);
      });

      it('should return null for undefined input', () => {
        expect(getRegistrationError(undefined)).toBe(null);
      });
    });

    describe('edge cases', () => {
      it('should return GENERIC_SIGNUP_ERROR_KEY for whitespace-only string', () => {
        expect(getRegistrationError('   ')).toBe(GENERIC_SIGNUP_ERROR_KEY);
      });

      it('should return GENERIC_SIGNUP_ERROR_KEY for string with only one keyword', () => {
        expect(getRegistrationError('email')).toBe(GENERIC_SIGNUP_ERROR_KEY);
        expect(getRegistrationError('exists')).toBe(GENERIC_SIGNUP_ERROR_KEY);
      });

      it('should handle keywords with special characters around them', () => {
        expect(getRegistrationError('email! exists?')).toBe(EMAIL_ALREADY_USED_KEY);
        expect(getRegistrationError('[email] {exists}')).toBe(EMAIL_ALREADY_USED_KEY);
      });

      it('should handle keywords in JSON-like strings', () => {
        expect(getRegistrationError('{"error": "Email already exists", "code": 409}')).toBe(
          EMAIL_ALREADY_USED_KEY
        );
      });

      it('should handle keywords in sentences', () => {
        expect(
          getRegistrationError(
            'Registration failed because the email you provided already exists in our system'
          )
        ).toBe(EMAIL_ALREADY_USED_KEY);
      });

      it('should handle partial matches correctly (should not match)', () => {
        expect(getRegistrationError('emailer existent')).toBe(GENERIC_SIGNUP_ERROR_KEY);
      });

      it('should handle keywords as substrings', () => {
        expect(getRegistrationError('email@test.com exists')).toBe(EMAIL_ALREADY_USED_KEY);
        expect(getRegistrationError('myemail preexists')).toBe(EMAIL_ALREADY_USED_KEY);
      });

      it('should return GENERIC_SIGNUP_ERROR_KEY for strings with newlines', () => {
        expect(getRegistrationError('Error occurred\nPlease try again')).toBe(
          GENERIC_SIGNUP_ERROR_KEY
        );
      });

      it('should return EMAIL_ALREADY_USED_KEY for strings with newlines containing both keywords', () => {
        expect(getRegistrationError('Email\nalready\nexists')).toBe(EMAIL_ALREADY_USED_KEY);
      });

      it('should handle Unicode characters', () => {
        expect(getRegistrationError('Email вже exists')).toBe(EMAIL_ALREADY_USED_KEY);
      });
    });

    describe('case sensitivity', () => {
      it.each([
        'EMAIL EXISTS',
        'email exists',
        'Email Exists',
        'EmAiL eXiStS',
        'EMAIL ALREADY EXISTS',
        'email already exists',
        'Email Already Exists',
      ])('should be case insensitive for: %s', (error) => {
        expect(getRegistrationError(error)).toBe(EMAIL_ALREADY_USED_KEY);
      });
    });

    describe('return type consistency', () => {
      it('should return string or null', () => {
        const result1 = getRegistrationError('email exists');
        const result2 = getRegistrationError(null);
        const result3 = getRegistrationError('random error');

        expect(typeof result1 === 'string' || result1 === null).toBe(true);
        expect(typeof result2 === 'string' || result2 === null).toBe(true);
        expect(typeof result3 === 'string' || result3 === null).toBe(true);
      });

      it('should always return one of the three possible values', () => {
        const possibleValues = [EMAIL_ALREADY_USED_KEY, GENERIC_SIGNUP_ERROR_KEY, null];

        expect(possibleValues).toContain(getRegistrationError('email exists'));
        expect(possibleValues).toContain(getRegistrationError('random error'));
        expect(possibleValues).toContain(getRegistrationError(null));
      });
    });

    describe('pattern matching logic', () => {
      it('should require both keywords for EMAIL_ALREADY_USED_KEY', () => {
        expect(getRegistrationError('email test exists')).toBe(EMAIL_ALREADY_USED_KEY);
        expect(getRegistrationError('email test')).toBe(GENERIC_SIGNUP_ERROR_KEY);
        expect(getRegistrationError('test exists')).toBe(GENERIC_SIGNUP_ERROR_KEY);
      });

      it('should match keywords anywhere in the string', () => {
        expect(getRegistrationError('Start email middle exists end')).toBe(EMAIL_ALREADY_USED_KEY);
        expect(getRegistrationError('exists first email second')).toBe(EMAIL_ALREADY_USED_KEY);
      });

      it('should handle keywords with no space between (as substrings)', () => {
        expect(getRegistrationError('emailexists')).toBe(EMAIL_ALREADY_USED_KEY);
      });
    });
  });
});
