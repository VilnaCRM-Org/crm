import { TFunction } from 'i18next';

import { createValidators } from '@/modules/User/features/Auth/components/FormSection/Validations';
import { fullNameValidators } from '@/modules/User/features/Auth/components/FormSection/Validations/name';

import emptyUser from './constants';

jest.mock('i18next', () => ({
  t: (key: string): string => key,
}));

describe('name validation', () => {
  describe('validators', () => {
    describe('isEmpty', () => {
      it('should return true for empty string', () => {
        expect(fullNameValidators.isEmpty('')).toBe(true);
      });

      it('should return true for whitespace only', () => {
        expect(fullNameValidators.isEmpty('   ')).toBe(true);
        expect(fullNameValidators.isEmpty('\t')).toBe(true);
        expect(fullNameValidators.isEmpty('\n')).toBe(true);
      });

      it('should return false for non-empty string', () => {
        expect(fullNameValidators.isEmpty('John Doe')).toBe(false);
        expect(fullNameValidators.isEmpty(' John Doe ')).toBe(false);
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
          expect(fullNameValidators.isLettersOnly(name)).toBe(true);
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
          expect(fullNameValidators.isLettersOnly(name)).toBe(false);
        });
      });

      describe('edge cases', () => {
        it('should reject consecutive spaces (regex does not allow)', () => {
          expect(fullNameValidators.isLettersOnly('John  Doe')).toBe(false);
        });

        it('should reject consecutive hyphens (regex does not allow)', () => {
          expect(fullNameValidators.isLettersOnly('John--Doe')).toBe(false);
        });

        it('should reject consecutive apostrophes (regex does not allow)', () => {
          expect(fullNameValidators.isLettersOnly("John''Doe")).toBe(false);
        });

        it('should handle mixed separators', () => {
          expect(fullNameValidators.isLettersOnly("John-Paul O'Brien Smith")).toBe(true);
        });

        it('should reject starting with separator', () => {
          expect(fullNameValidators.isLettersOnly(' John')).toBe(false);
          expect(fullNameValidators.isLettersOnly('-John')).toBe(false);
          expect(fullNameValidators.isLettersOnly("'John")).toBe(false);
        });

        it('should reject ending with separator', () => {
          expect(fullNameValidators.isLettersOnly('John ')).toBe(false);
          expect(fullNameValidators.isLettersOnly('John-')).toBe(false);
          expect(fullNameValidators.isLettersOnly("John'")).toBe(false);
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
          expect(fullNameValidators.isFormatted(name)).toBe(true);
        });
      });

      describe('invalid full names - single name', () => {
        it.each(['John', 'Mary', 'Іван', 'Марія'])(
          'should return false for single name: %s',
          (name) => {
            expect(fullNameValidators.isFormatted(name)).toBe(false);
          }
        );
      });

      describe('invalid full names - too short', () => {
        it('should return false for name with single character', () => {
          expect(fullNameValidators.isFormatted('J')).toBe(false);
        });

        it('should return true for name with 2 characters total including space', () => {
          // Note: 'A B' is 3 characters total (A, space, B) which is >= 2
          expect(fullNameValidators.isFormatted('A B')).toBe(true);
        });
      });

      describe('invalid full names - too long', () => {
        it('should return false for name longer than 255 characters', () => {
          const longName = 'A'.repeat(128) + ' ' + 'B'.repeat(128);
          expect(fullNameValidators.isFormatted(longName)).toBe(false);
        });

        it('should return true for name exactly 255 characters', () => {
          const exactName = 'A'.repeat(127) + ' ' + 'B'.repeat(127);
          expect(exactName.length).toBe(255);
          expect(fullNameValidators.isFormatted(exactName)).toBe(true);
        });

        it('should return true for name less than 255 characters', () => {
          const validName = 'A'.repeat(100) + ' ' + 'B'.repeat(100);
          expect(validName.length).toBeLessThan(255);
          expect(fullNameValidators.isFormatted(validName)).toBe(true);
        });
      });

      describe('edge cases', () => {
        it('should handle two-character names correctly', () => {
          expect(fullNameValidators.isFormatted('Jo Do')).toBe(true);
        });

        it('should handle names with hyphens', () => {
          expect(fullNameValidators.isFormatted('Mary-Jane Doe')).toBe(true);
          expect(fullNameValidators.isFormatted('John Smith-Jones')).toBe(true);
        });

        it('should handle names with apostrophes', () => {
          expect(fullNameValidators.isFormatted("Patrick O'Brien")).toBe(true);
          expect(fullNameValidators.isFormatted("Mary D'Angelo")).toBe(true);
        });

        it('should handle three-part names', () => {
          expect(fullNameValidators.isFormatted('John Paul Smith')).toBe(true);
        });

        it('should handle four-part names', () => {
          expect(fullNameValidators.isFormatted('Jean Claude Van Damme')).toBe(true);
        });

        it('should reject starting with separator', () => {
          expect(fullNameValidators.isFormatted(' John Doe')).toBe(false);
        });

        it('should reject ending with separator', () => {
          expect(fullNameValidators.isFormatted('John Doe ')).toBe(false);
        });
      });
    });
  });

  describe('validators.fullName', () => {
    const tMock = ((key: string) => key) as unknown as TFunction;
    const validators = createValidators(tMock);

    describe('valid full names', () => {
      it('should return true for valid full name', () => {
        expect(validators.fullName('John Doe', emptyUser)).toBe(true);
      });

      it.each([
        'Іван Петров',
        'Mary Jane Smith',
        "Patrick O'Brien",
        'Jean-Claude Van Damme',
        'Марія Коваленко',
      ])('should return true for valid full name: %s', (name) => {
        expect(validators.fullName(name, emptyUser)).toBe(true);
      });
    });

    describe('empty input', () => {
      it('should return required error for empty string', () => {
        expect(validators.fullName('', emptyUser)).toBe('sign_up.form.name_input.required');
      });

      it('should return required error for whitespace only', () => {
        expect(validators.fullName('   ', emptyUser)).toBe('sign_up.form.name_input.required');
      });

      it('should return required error for undefined', () => {
        expect(validators.fullName(undefined as unknown as string, emptyUser)).toBe(
          'sign_up.form.name_input.required'
        );
      });

      it('should return required error for null', () => {
        expect(validators.fullName(null as unknown as string, emptyUser)).toBe(
          'sign_up.form.name_input.required'
        );
      });
    });

    describe('special characters error', () => {
      it.each(['John123 Doe', 'John@ Doe', 'John. Doe', 'John_ Doe', 'John! Doe', 'John# Doe'])(
        'should return special characters error for: %s',
        (name) => {
          expect(validators.fullName(name, emptyUser)).toBe(
            'sign_up.form.name_input.special_characters_error'
          );
        }
      );
    });

    describe('format error', () => {
      it('should return format error for single name', () => {
        expect(validators.fullName('John', emptyUser)).toBe(
          'sign_up.form.name_input.full_name_format_error'
        );
      });

      it('should return format error for too short name', () => {
        expect(validators.fullName('J', emptyUser)).toBe(
          'sign_up.form.name_input.full_name_format_error'
        );
      });

      it('should return format error for too long name', () => {
        const longName = 'A'.repeat(128) + ' ' + 'B'.repeat(128);
        expect(validators.fullName(longName, emptyUser)).toBe(
          'sign_up.form.name_input.full_name_format_error'
        );
      });
    });

    describe('validation order', () => {
      it('should check required before letters only', () => {
        const result = validators.fullName('', emptyUser);
        expect(result).toBe('sign_up.form.name_input.required');
      });

      it('should check letters only before format', () => {
        const result = validators.fullName('John123', emptyUser);
        expect(result).toBe('sign_up.form.name_input.special_characters_error');
        expect(result).not.toBe('sign_up.form.name_input.full_name_format_error');
      });

      it('should check format after letters only', () => {
        const result = validators.fullName('John', emptyUser);
        expect(result).toBe('sign_up.form.name_input.full_name_format_error');
      });
    });

    describe('trimming behavior', () => {
      it('should trim leading spaces and validate', () => {
        expect(validators.fullName('  John Doe', emptyUser)).toBe(true);
      });

      it('should trim trailing spaces and validate', () => {
        expect(validators.fullName('John Doe  ', emptyUser)).toBe(true);
      });

      it('should trim both leading and trailing spaces', () => {
        expect(validators.fullName('  John Doe  ', emptyUser)).toBe(true);
      });

      it('should trim to empty and return required error', () => {
        expect(validators.fullName('   ', emptyUser)).toBe('sign_up.form.name_input.required');
      });
    });

    describe('edge cases', () => {
      it('should handle Ukrainian names', () => {
        expect(validators.fullName('Іван Петров', emptyUser)).toBe(true);
        expect(validators.fullName('Марія Коваленко', emptyUser)).toBe(true);
        expect(validators.fullName('Євген Шевченко', emptyUser)).toBe(true);
        expect(validators.fullName('Ірина Мельник', emptyUser)).toBe(true);
        expect(validators.fullName('Ґрунтовський Олександр', emptyUser)).toBe(true);
      });

      it('should handle names with hyphens', () => {
        expect(validators.fullName('Mary-Jane Smith', emptyUser)).toBe(true);
        expect(validators.fullName('Jean-Claude Van Damme', emptyUser)).toBe(true);
      });

      it('should handle names with apostrophes', () => {
        expect(validators.fullName("Patrick O'Brien", emptyUser)).toBe(true);
        expect(validators.fullName("Mary D'Angelo", emptyUser)).toBe(true);
      });

      it('should handle multi-part names', () => {
        expect(validators.fullName('John Paul George Ringo', emptyUser)).toBe(true);
      });

      it('should handle mixed Ukrainian and English', () => {
        // Note: This depends on the regex implementation
        expect(validators.fullName('John Петров', emptyUser)).toBe(true);
      });
    });
  });
});
