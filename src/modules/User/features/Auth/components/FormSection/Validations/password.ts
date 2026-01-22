import { FieldValues, Validate } from 'react-hook-form';

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 64;

type ValidationFunction = (value: string) => boolean;
type ValidationKeys = 'isLengthValid' | 'hasNumbers' | 'hasUppercase';

export const passwordValidators: Record<ValidationKeys, ValidationFunction> = {
  isLengthValid: (value) =>
    value.length >= MIN_PASSWORD_LENGTH && value.length <= MAX_PASSWORD_LENGTH,
  hasNumbers: (value) => /\d/.test(value),
  hasUppercase: (value) => /\p{Lu}/u.test(value),
};

const createPasswordValidator =
  <TFieldValues extends FieldValues>(t: (key: string) => string): Validate<string, TFieldValues> =>
  (password: string) => {
    const input = password || '';

    const messages = {
      required: t('sign_up.form.password_input.required'),
      lengthError: t('sign_up.form.password_input.error_length'),
      numbersError: t('sign_up.form.password_input.error_numbers'),
      uppercaseError: t('sign_up.form.password_input.error_uppercase'),
    };

    if (input.trim().length === 0) return messages.required;
    if (!passwordValidators.isLengthValid(input)) return messages.lengthError;
    if (!passwordValidators.hasNumbers(input)) return messages.numbersError;
    if (!passwordValidators.hasUppercase(input)) return messages.uppercaseError;

    return true;
  };

export default createPasswordValidator;
