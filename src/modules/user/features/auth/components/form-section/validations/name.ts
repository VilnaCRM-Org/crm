import { FieldValues, Validate } from 'react-hook-form';

const MAX_FULL_NAME_LENGTH = 255;
const ALLOWED_NAME_CHARACTERS = '[A-Za-zА-Яа-яІіЇїЄєҐґ]';
const NAME_SEPARATORS = `[\\s'-]`;
const SINGLE_NAME_PATTERN = `${ALLOWED_NAME_CHARACTERS}+`;
const NAME_WITH_SEPARATORS_PATTERN = `${SINGLE_NAME_PATTERN}(?:${NAME_SEPARATORS}${SINGLE_NAME_PATTERN})*`;
const FULL_NAME_PATTERN = `${SINGLE_NAME_PATTERN}(?:${NAME_SEPARATORS}${SINGLE_NAME_PATTERN})+`;

type ValidationFunction = (value: string) => boolean;
type ValidationKeys = 'isLettersOnly' | 'isFormatted' | 'isEmpty';

export const fullNameValidators: Record<ValidationKeys, ValidationFunction> = {
  isLettersOnly: (value) => new RegExp(`^${NAME_WITH_SEPARATORS_PATTERN}$`).test(value),
  isFormatted: (value) =>
    new RegExp(`^${FULL_NAME_PATTERN}$`).test(value) &&
    value.length >= 2 &&
    value.length <= MAX_FULL_NAME_LENGTH,
  isEmpty: (value) => value.trim().length === 0,
};

/**
 * Factory to create a fullName validator with translations.
 * @param t - translation function
 */
const createFullNameValidator =
  <TFieldValues extends FieldValues>(t: (key: string) => string): Validate<string, TFieldValues> =>
  (fullName: string) => {
    const input = fullName || '';

    const messages = {
      required: t('sign_up.form.name_input.required'),
      lettersOnlyError: t('sign_up.form.name_input.special_characters_error'),
      formatError: t('sign_up.form.name_input.full_name_format_error'),
    };

    if (fullNameValidators.isEmpty(input)) return messages.required;
    const trimmed = input.trim();
    if (!fullNameValidators.isLettersOnly(trimmed)) return messages.lettersOnlyError;
    if (!fullNameValidators.isFormatted(trimmed)) return messages.formatError;

    return true;
  };
export default createFullNameValidator;
