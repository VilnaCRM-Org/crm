import type { TFunction } from 'i18next';
import { FieldValues, Validate } from 'react-hook-form';

const isLengthValid = (value: string): boolean => value.length >= 8 && value.length <= 64;

const hasNumber = (value: string): boolean => /[0-9]/.test(value);

const hasUppercase = (value: string): boolean => /\p{Lu}/u.test(value);

type ValidationPswdMessageKey =
  | 'invalidLength'
  | 'numberRequired'
  | 'uppercaseRequired'
  | 'fieldRequired';

const createPasswordValidator =
  <TFieldValues extends FieldValues>(t: TFunction): Validate<string, TFieldValues> =>
  (value: string) => {
    const messages: Record<ValidationPswdMessageKey, string> = {
      invalidLength: t('sign_up.form.password_input.error_length'),
      numberRequired: t('sign_up.form.password_input.error_numbers'),
      uppercaseRequired: t('sign_up.form.password_input.error_uppercase'),
      fieldRequired: t('sign_up.form.password_input.error_required'),
    };

    if (!value?.trim()) return messages.fieldRequired;
    if (!isLengthValid(value)) return messages.invalidLength;
    if (!hasNumber(value)) return messages.numberRequired;
    if (!hasUppercase(value)) return messages.uppercaseRequired;

    return true;
  };

export default createPasswordValidator;
