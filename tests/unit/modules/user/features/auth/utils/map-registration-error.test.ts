import registrationErrorMapper, {
  EMAIL_ALREADY_USED_KEY,
  GENERIC_SIGNUP_ERROR_KEY,
} from '@/modules/user/features/auth/utils/map-registration-error';

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
        expect(registrationErrorMapper.map('Email already exists')).toBe(EMAIL_ALREADY_USED_KEY);
      });

      it('returns EMAIL_ALREADY_USED_KEY for "email" and "exists" (case insensitive)', () => {
        expect(registrationErrorMapper.map('EMAIL ALREADY EXISTS')).toBe(EMAIL_ALREADY_USED_KEY);
        expect(registrationErrorMapper.map('Email Already Exists')).toBe(EMAIL_ALREADY_USED_KEY);
        expect(registrationErrorMapper.map('email already exists')).toBe(EMAIL_ALREADY_USED_KEY);
      });

      it('should return EMAIL_ALREADY_USED_KEY for error with both keywords in any order', () => {
        expect(registrationErrorMapper.map('Exists email')).toBe(EMAIL_ALREADY_USED_KEY);
        expect(registrationErrorMapper.map('This email exists in system')).toBe(
          EMAIL_ALREADY_USED_KEY
        );
      });

      it('returns EMAIL_ALREADY_USED_KEY when keywords are separated by other words', () => {
        expect(
          registrationErrorMapper.map('The email address already exists in our database')
        ).toBe(EMAIL_ALREADY_USED_KEY);
        expect(registrationErrorMapper.map('User with this email exists')).toBe(
          EMAIL_ALREADY_USED_KEY
        );
      });

      it('should return EMAIL_ALREADY_USED_KEY for error with mixed case', () => {
        expect(registrationErrorMapper.map('EmAiL aLrEaDy ExIsTs')).toBe(EMAIL_ALREADY_USED_KEY);
      });

      it('should return EMAIL_ALREADY_USED_KEY for error with extra whitespace', () => {
        expect(registrationErrorMapper.map('  email   already   exists  ')).toBe(
          EMAIL_ALREADY_USED_KEY
        );
      });
    });

    describe('generic errors', () => {
      it('should return GENERIC_SIGNUP_ERROR_KEY for error without both keywords', () => {
        expect(registrationErrorMapper.map('Something went wrong')).toBe(GENERIC_SIGNUP_ERROR_KEY);
      });

      it('should return GENERIC_SIGNUP_ERROR_KEY for error with only "email" keyword', () => {
        expect(registrationErrorMapper.map('Invalid email format')).toBe(GENERIC_SIGNUP_ERROR_KEY);
      });

      it('should return GENERIC_SIGNUP_ERROR_KEY for error with only "exists" keyword', () => {
        expect(registrationErrorMapper.map('User already exists')).toBe(GENERIC_SIGNUP_ERROR_KEY);
      });

      it('should return GENERIC_SIGNUP_ERROR_KEY for network errors', () => {
        expect(registrationErrorMapper.map('Network error')).toBe(GENERIC_SIGNUP_ERROR_KEY);
        expect(registrationErrorMapper.map('Connection timeout')).toBe(GENERIC_SIGNUP_ERROR_KEY);
      });

      it('should return GENERIC_SIGNUP_ERROR_KEY for validation errors', () => {
        expect(registrationErrorMapper.map('Validation failed')).toBe(GENERIC_SIGNUP_ERROR_KEY);
        expect(registrationErrorMapper.map('Password too weak')).toBe(GENERIC_SIGNUP_ERROR_KEY);
      });

      it('should return GENERIC_SIGNUP_ERROR_KEY for server errors', () => {
        expect(registrationErrorMapper.map('Internal server error')).toBe(GENERIC_SIGNUP_ERROR_KEY);
        expect(registrationErrorMapper.map('500 Internal Server Error')).toBe(
          GENERIC_SIGNUP_ERROR_KEY
        );
      });

      it('should return null for empty string', () => {
        expect(registrationErrorMapper.map('')).toBe(null);
      });

      it('should return GENERIC_SIGNUP_ERROR_KEY for random text', () => {
        expect(registrationErrorMapper.map('Random error message')).toBe(GENERIC_SIGNUP_ERROR_KEY);
      });
    });

    describe('null and undefined handling', () => {
      it('should return null for null input', () => {
        expect(registrationErrorMapper.map(null)).toBe(null);
      });

      it('should return null for undefined input', () => {
        expect(registrationErrorMapper.map(undefined)).toBe(null);
      });
    });

    describe('edge cases', () => {
      it('should return GENERIC_SIGNUP_ERROR_KEY for whitespace-only string', () => {
        expect(registrationErrorMapper.map('   ')).toBe(GENERIC_SIGNUP_ERROR_KEY);
      });

      it('should return GENERIC_SIGNUP_ERROR_KEY for string with only one keyword', () => {
        expect(registrationErrorMapper.map('email')).toBe(GENERIC_SIGNUP_ERROR_KEY);
        expect(registrationErrorMapper.map('exists')).toBe(GENERIC_SIGNUP_ERROR_KEY);
      });

      it('should handle keywords with special characters around them', () => {
        expect(registrationErrorMapper.map('email! exists?')).toBe(EMAIL_ALREADY_USED_KEY);
        expect(registrationErrorMapper.map('[email] {exists}')).toBe(EMAIL_ALREADY_USED_KEY);
      });

      it('should handle keywords in JSON-like strings', () => {
        expect(registrationErrorMapper.map('{"error": "Email already exists", "code": 409}')).toBe(
          EMAIL_ALREADY_USED_KEY
        );
      });

      it('should handle keywords in sentences', () => {
        expect(
          registrationErrorMapper.map(
            'Registration failed because the email you provided already exists in our system'
          )
        ).toBe(EMAIL_ALREADY_USED_KEY);
      });

      it('should handle partial matches correctly (should not match)', () => {
        expect(registrationErrorMapper.map('emailer existent')).toBe(GENERIC_SIGNUP_ERROR_KEY);
      });

      it('should handle keywords as substrings', () => {
        expect(registrationErrorMapper.map('email@test.com exists')).toBe(EMAIL_ALREADY_USED_KEY);
        expect(registrationErrorMapper.map('myemail preexists')).toBe(EMAIL_ALREADY_USED_KEY);
      });

      it('should return GENERIC_SIGNUP_ERROR_KEY for strings with newlines', () => {
        expect(registrationErrorMapper.map('Error occurred\nPlease try again')).toBe(
          GENERIC_SIGNUP_ERROR_KEY
        );
      });

      it('returns EMAIL_ALREADY_USED_KEY for newlines containing both keywords', () => {
        expect(registrationErrorMapper.map('Email\nalready\nexists')).toBe(EMAIL_ALREADY_USED_KEY);
      });

      it('should handle Unicode characters', () => {
        expect(registrationErrorMapper.map('Email вже exists')).toBe(EMAIL_ALREADY_USED_KEY);
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
        expect(registrationErrorMapper.map(error)).toBe(EMAIL_ALREADY_USED_KEY);
      });
    });

    describe('return type consistency', () => {
      it('should return string or null', () => {
        const result1 = registrationErrorMapper.map('email exists');
        const result2 = registrationErrorMapper.map(null);
        const result3 = registrationErrorMapper.map('random error');

        expect(typeof result1 === 'string' || result1 === null).toBe(true);
        expect(typeof result2 === 'string' || result2 === null).toBe(true);
        expect(typeof result3 === 'string' || result3 === null).toBe(true);
      });

      it('should always return one of the three possible values', () => {
        const possibleValues = [EMAIL_ALREADY_USED_KEY, GENERIC_SIGNUP_ERROR_KEY, null];

        expect(possibleValues).toContain(registrationErrorMapper.map('email exists'));
        expect(possibleValues).toContain(registrationErrorMapper.map('random error'));
        expect(possibleValues).toContain(registrationErrorMapper.map(null));
      });
    });

    describe('pattern matching logic', () => {
      it('should require both keywords for EMAIL_ALREADY_USED_KEY', () => {
        expect(registrationErrorMapper.map('email test exists')).toBe(EMAIL_ALREADY_USED_KEY);
        expect(registrationErrorMapper.map('email test')).toBe(GENERIC_SIGNUP_ERROR_KEY);
        expect(registrationErrorMapper.map('test exists')).toBe(GENERIC_SIGNUP_ERROR_KEY);
      });

      it('should match keywords anywhere in the string', () => {
        expect(registrationErrorMapper.map('Start email middle exists end')).toBe(
          EMAIL_ALREADY_USED_KEY
        );
        expect(registrationErrorMapper.map('exists first email second')).toBe(
          EMAIL_ALREADY_USED_KEY
        );
      });

      it('should handle keywords with no space between (as substrings)', () => {
        expect(registrationErrorMapper.map('emailexists')).toBe(EMAIL_ALREADY_USED_KEY);
      });
    });
  });
});
