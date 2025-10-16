import validateFullName, {
  getValidationMessages,
  validators,
} from '@/modules/User/features/Auth/components/FormSection/Validations/name';

import emptyUser from './contsants';

jest.mock('i18next', () => ({
  t: (key: string): string => key,
}));

describe('name validation', () => {
  describe('getValidationMessages', () => {
    it('should return all validation message keys', () => {
      const messages = getValidationMessages();

      expect(messages).toEqual({
        formatError: 'sign_up.form.name_input.full_name_format_error',
        lettersOnlyError: 'sign_up.form.name_input.special_characters_error',
        required: 'sign_up.form.name_input.required',
      });
    });

    it('should return consistent keys on multiple calls', () => {
      const messages1 = getValidationMessages();
      const messages2 = getValidationMessages();

      expect(messages1).toEqual(messages2);
    });
  });

  describe('validators', () => {
    describe('isEmpty', () => {
      it('should return true for empty string', () => {
        expect(validators.isEmpty('')).toBe(true);
      });

      it('should return true for whitespace only', () => {
        expect(validators.isEmpty('   ')).toBe(true);
        expect(validators.isEmpty('\t')).toBe(true);
        expect(validators.isEmpty('\n')).toBe(true);
      });

      it('should return false for non-empty string', () => {
        expect(validators.isEmpty('John Doe')).toBe(false);
        expect(validators.isEmpty(' John Doe ')).toBe(false);
      });
    });

    describe('isLettersOnly', () => {
      describe('valid names with allowed characters', () => {
        it.each([
          'John',
          'Mary',
          'Іван',
          'Марія',
          'Олексій',
          'Юлія',
          'Євген',
          'Ірина',
          'Ґрунт',
          'John Doe',
          "O'Brien",
          'Mary-Jane',
          'Jean-Claude',
          'Іван Петров',
          'Марія-Олена',
          "Д'Артаньян",
          'Jean Claude Van Damme',
          'John-Paul Mary-Jane',
        ])('should return true for valid name: %s', (name) => {
          expect(validators.isLettersOnly(name)).toBe(true);
        });
      });

      describe('invalid names with special characters', () => {
        it.each([
          'John123',
          'Mary@Example',
          'John.Doe',
          'John_Doe',
          'John!Doe',
          'John#Doe',
          'John$Doe',
          'John%Doe',
          'John&Doe',
          'John*Doe',
          'John+Doe',
          'John=Doe',
          'John[Doe]',
          'John{Doe}',
          'John|Doe',
          'John\\Doe',
          'John/Doe',
          'John?Doe',
          'John<Doe>',
          'John,Doe',
          'John;Doe',
          'John:Doe',
        ])('should return false for invalid name: %s', (name) => {
          expect(validators.isLettersOnly(name)).toBe(false);
        });
      });

      describe('edge cases', () => {
        it('should reject consecutive spaces (regex does not allow)', () => {
          expect(validators.isLettersOnly('John  Doe')).toBe(false);
        });

        it('should reject consecutive hyphens (regex does not allow)', () => {
          expect(validators.isLettersOnly('John--Doe')).toBe(false);
        });

        it('should reject consecutive apostrophes (regex does not allow)', () => {
          expect(validators.isLettersOnly("John''Doe")).toBe(false);
        });

        it('should handle mixed separators', () => {
          expect(validators.isLettersOnly("John-Paul O'Brien Smith")).toBe(true);
        });

        it('should reject starting with separator', () => {
          expect(validators.isLettersOnly(' John')).toBe(false);
          expect(validators.isLettersOnly('-John')).toBe(false);
          expect(validators.isLettersOnly("'John")).toBe(false);
        });

        it('should reject ending with separator', () => {
          expect(validators.isLettersOnly('John ')).toBe(false);
          expect(validators.isLettersOnly('John-')).toBe(false);
          expect(validators.isLettersOnly("John'")).toBe(false);
        });
      });
    });

    describe('isFormatted', () => {
      describe('valid full names', () => {
        it.each([
          'John Doe',
          'Іван Петров',
          'Mary Jane Smith',
          "Patrick O'Brien",
          'Jean-Claude Van Damme',
          'Марія Коваленко',
          'Олена Шевченко-Петренко',
          'Anne Marie Claire',
        ])('should return true for valid full name: %s', (name) => {
          expect(validators.isFormatted(name)).toBe(true);
        });
      });

      describe('invalid full names - single name', () => {
        it.each(['John', 'Mary', 'Іван', 'Марія'])(
          'should return false for single name: %s',
          (name) => {
            expect(validators.isFormatted(name)).toBe(false);
          }
        );
      });

      describe('invalid full names - too short', () => {
        it('should return false for name with single character', () => {
          expect(validators.isFormatted('J')).toBe(false);
        });

        it('should return true for name with 2 characters total including space', () => {
          // Note: 'A B' is 3 characters total (A, space, B) which is >= 2
          expect(validators.isFormatted('A B')).toBe(true);
        });
      });

      describe('invalid full names - too long', () => {
        it('should return false for name longer than 255 characters', () => {
          const longName = 'A'.repeat(128) + ' ' + 'B'.repeat(128);
          expect(validators.isFormatted(longName)).toBe(false);
        });

        it('should return true for name exactly 255 characters', () => {
          const exactName = 'A'.repeat(127) + ' ' + 'B'.repeat(127);
          expect(exactName.length).toBe(255);
          expect(validators.isFormatted(exactName)).toBe(true);
        });

        it('should return true for name less than 255 characters', () => {
          const validName = 'A'.repeat(100) + ' ' + 'B'.repeat(100);
          expect(validName.length).toBeLessThan(255);
          expect(validators.isFormatted(validName)).toBe(true);
        });
      });

      describe('edge cases', () => {
        it('should handle two-character names correctly', () => {
          expect(validators.isFormatted('Jo Do')).toBe(true);
        });

        it('should handle names with hyphens', () => {
          expect(validators.isFormatted('Mary-Jane Doe')).toBe(true);
          expect(validators.isFormatted('John Smith-Jones')).toBe(true);
        });

        it('should handle names with apostrophes', () => {
          expect(validators.isFormatted("Patrick O'Brien")).toBe(true);
          expect(validators.isFormatted("Mary D'Angelo")).toBe(true);
        });

        it('should handle three-part names', () => {
          expect(validators.isFormatted('John Paul Smith')).toBe(true);
        });

        it('should handle four-part names', () => {
          expect(validators.isFormatted('Jean Claude Van Damme')).toBe(true);
        });

        it('should reject starting with separator', () => {
          expect(validators.isFormatted(' John Doe')).toBe(false);
        });

        it('should reject ending with separator', () => {
          expect(validators.isFormatted('John Doe ')).toBe(false);
        });
      });
    });
  });

  describe('validateFullName', () => {
    describe('valid full names', () => {
      it('should return true for valid full name', () => {
        expect(validateFullName('John Doe', emptyUser)).toBe(true);
      });

      it.each([
        'Іван Петров',
        'Mary Jane Smith',
        "Patrick O'Brien",
        'Jean-Claude Van Damme',
        'Марія Коваленко',
      ])('should return true for valid full name: %s', (name) => {
        expect(validateFullName(name, emptyUser)).toBe(true);
      });
    });

    describe('empty input', () => {
      it('should return required error for empty string', () => {
        expect(validateFullName('', emptyUser)).toBe('sign_up.form.name_input.required');
      });

      it('should return required error for whitespace only', () => {
        expect(validateFullName('   ', emptyUser)).toBe('sign_up.form.name_input.required');
      });

      it('should return required error for undefined', () => {
        expect(validateFullName(undefined as unknown as string, emptyUser)).toBe(
          'sign_up.form.name_input.required'
        );
      });

      it('should return required error for null', () => {
        expect(validateFullName(null as unknown as string, emptyUser)).toBe(
          'sign_up.form.name_input.required'
        );
      });
    });

    describe('special characters error', () => {
      it.each(['John123 Doe', 'John@ Doe', 'John. Doe', 'John_ Doe', 'John! Doe', 'John# Doe'])(
        'should return special characters error for: %s',
        (name) => {
          expect(validateFullName(name, emptyUser)).toBe(
            'sign_up.form.name_input.special_characters_error'
          );
        }
      );
    });

    describe('format error', () => {
      it('should return format error for single name', () => {
        expect(validateFullName('John', emptyUser)).toBe(
          'sign_up.form.name_input.full_name_format_error'
        );
      });

      it('should return format error for too short name', () => {
        expect(validateFullName('J', emptyUser)).toBe(
          'sign_up.form.name_input.full_name_format_error'
        );
      });

      it('should return format error for too long name', () => {
        const longName = 'A'.repeat(128) + ' ' + 'B'.repeat(128);
        expect(validateFullName(longName, emptyUser)).toBe(
          'sign_up.form.name_input.full_name_format_error'
        );
      });
    });

    describe('validation order', () => {
      it('should check required before letters only', () => {
        const result = validateFullName('', emptyUser);
        expect(result).toBe('sign_up.form.name_input.required');
      });

      it('should check letters only before format', () => {
        const result = validateFullName('John123', emptyUser);
        expect(result).toBe('sign_up.form.name_input.special_characters_error');
        expect(result).not.toBe('sign_up.form.name_input.full_name_format_error');
      });

      it('should check format after letters only', () => {
        const result = validateFullName('John', emptyUser);
        expect(result).toBe('sign_up.form.name_input.full_name_format_error');
      });
    });

    describe('trimming behavior', () => {
      it('should trim leading spaces and validate', () => {
        expect(validateFullName('  John Doe', emptyUser)).toBe(true);
      });

      it('should trim trailing spaces and validate', () => {
        expect(validateFullName('John Doe  ', emptyUser)).toBe(true);
      });

      it('should trim both leading and trailing spaces', () => {
        expect(validateFullName('  John Doe  ', emptyUser)).toBe(true);
      });

      it('should trim to empty and return required error', () => {
        expect(validateFullName('   ', emptyUser)).toBe('sign_up.form.name_input.required');
      });
    });

    describe('edge cases', () => {
      it('should handle Ukrainian names', () => {
        expect(validateFullName('Іван Петров', emptyUser)).toBe(true);
        expect(validateFullName('Марія Коваленко', emptyUser)).toBe(true);
        expect(validateFullName('Євген Шевченко', emptyUser)).toBe(true);
        expect(validateFullName('Ірина Мельник', emptyUser)).toBe(true);
        expect(validateFullName('Ґрунтовський Олександр', emptyUser)).toBe(true);
      });

      it('should handle names with hyphens', () => {
        expect(validateFullName('Mary-Jane Smith', emptyUser)).toBe(true);
        expect(validateFullName('Jean-Claude Van Damme', emptyUser)).toBe(true);
      });

      it('should handle names with apostrophes', () => {
        expect(validateFullName("Patrick O'Brien", emptyUser)).toBe(true);
        expect(validateFullName("Mary D'Angelo", emptyUser)).toBe(true);
      });

      it('should handle multi-part names', () => {
        expect(validateFullName('John Paul George Ringo', emptyUser)).toBe(true);
      });

      it('should handle mixed Ukrainian and English', () => {
        // Note: This depends on the regex implementation
        expect(validateFullName('John Петров', emptyUser)).toBe(true);
      });
    });
  });
});
