import { t } from 'i18next';
import { Validate } from 'react-hook-form';

import { RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';

const MAX_FULL_NAME_LENGTH = 255;
const ALLOWED_NAME_CHARACTERS = '[A-Za-zА-Яа-яІіЇїЄєҐґ]';
const NAME_SEPARATORS = `[\\s'-]`;
const SINGLE_NAME_PATTERN = `${ALLOWED_NAME_CHARACTERS}+`;
const NAME_WITH_SEPARATORS_PATTERN = `${SINGLE_NAME_PATTERN}(?:${NAME_SEPARATORS}${SINGLE_NAME_PATTERN})*`;
const FULL_NAME_PATTERN = `${SINGLE_NAME_PATTERN}(?:${NAME_SEPARATORS}${SINGLE_NAME_PATTERN})+`;

type ValidationMessageKey = 'formatError' | 'lettersOnlyError' | 'required';

export const getValidationMessages = (): Record<ValidationMessageKey, string> => ({
  formatError: t('sign_up.form.name_input.full_name_format_error'),
  lettersOnlyError: t('sign_up.form.name_input.special_characters_error'),
  required: t('sign_up.form.name_input.required'),
});

type ValidationFunction = (value: string) => boolean;
type ValidationKeys = 'isLettersOnly' | 'isFormatted' | 'isEmpty';

export const validators: Record<ValidationKeys, ValidationFunction> = {
  isLettersOnly: (value) => new RegExp(`^${NAME_WITH_SEPARATORS_PATTERN}$`).test(value),
  isFormatted: (value) =>
    new RegExp(`^${FULL_NAME_PATTERN}$`).test(value) &&
    value.length >= 2 &&
    value.length <= MAX_FULL_NAME_LENGTH,
  isEmpty: (value) => value.trim().length === 0,
};
const validateFullName: Validate<string, RegisterUserDto> = (fullName) => {
  const input = fullName || '';
  const messages = getValidationMessages();

  if (validators.isEmpty(input)) {
    return messages.required;
  }

  const trimmed = input.trim();

  if (!validators.isLettersOnly(trimmed)) {
    return messages.lettersOnlyError;
  }

  if (!validators.isFormatted(trimmed)) {
    return messages.formatError;
  }

  return true;
};

export default validateFullName;
