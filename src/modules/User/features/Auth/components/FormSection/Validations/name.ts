import { t } from 'i18next';
import { Validate } from 'react-hook-form';

import { RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';

const MAX_INITIALS_LENGTH = 255;

type ValidationMessageKey = 'formatError' | 'lettersOnlyError' | 'required';

export const validationMessages: Record<ValidationMessageKey, string> = {
  formatError: t('sign_up.form.name_input.full_name_format_error'),
  lettersOnlyError: t('sign_up.form.name_input.special_characters_error'),
  required: t('sign_up.form.name_input.required'),
};

type ValidationFunction = (value: string) => boolean;
type ValidationKeys = 'isLettersOnly' | 'isFormatted' | 'isEmpty';

export const validators: Record<ValidationKeys, ValidationFunction> = {
  isLettersOnly: (value) =>
    /^[A-Za-zА-Яа-яІіЇїЄєҐґ]+(?:[\s''-][A-Za-zА-Яа-яІіЇїЄєҐґ]+)*$/.test(value),
  isFormatted: (value) =>
    /^[A-Za-zА-Яа-яІіЇїЄєҐґ]+(?:[\s''-][A-Za-zА-Яа-яІіЇїЄєҐґ]+)+$/.test(value) &&
    value.length >= 2 &&
    value.length <= MAX_INITIALS_LENGTH,
  isEmpty: (value) => value.trim().length === 0,
};
const validateFullName: Validate<string, RegisterUserDto> = (fullName) => {
  if (!fullName || validators.isEmpty(fullName)) {
    return validationMessages.required;
  }

  const trimmed = fullName.trim();

  if (!validators.isLettersOnly(trimmed)) {
    return validationMessages.lettersOnlyError;
  }

  if (!validators.isFormatted(trimmed)) {
    return validationMessages.formatError;
  }

  return true;
};

export default validateFullName;
