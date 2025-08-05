import { t } from 'i18next';
import { Validate, FieldValues } from 'react-hook-form';

const isLengthValid = (value: string): boolean => value.length >= 8 && value.length <= 64;

const hasNumber = (value: string): boolean => /[0-9]/.test(value);

const hasUppercase = (value: string): boolean => /\p{Lu}/u.test(value);

type ValidationPswdMessageKey = 'invalidLength' | 'numberRequired' | 'uppercaseRequired';

const validationPswdMessages: Record<ValidationPswdMessageKey, string> = {
  invalidLength: t('sign_up.form.password_input.error_length'),
  numberRequired: t('sign_up.form.password_input.error_numbers'),
  uppercaseRequired: t('sign_up.form.password_input.error_uppercase'),
};

const validatePassword: Validate<string, FieldValues> = (value: string) => {
  if (!value) return "Це поле обов'язкове";
  if (!isLengthValid(value)) return validationPswdMessages.invalidLength;
  if (!hasNumber(value)) return validationPswdMessages.numberRequired;
  if (!hasUppercase(value)) return validationPswdMessages.uppercaseRequired;
  return true;
};

export default validatePassword;
