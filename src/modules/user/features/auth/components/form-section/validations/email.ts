import { Validate, FieldValues } from 'react-hook-form';

const isBasicEmailFormat = (email: string): boolean => /@/.test(email) && /\./.test(email);

const EMAIL_LOCAL_PART = String.raw`[a-zA-Z0-9]([a-zA-Z0-9._%+-]*[a-zA-Z0-9])?`;
const EMAIL_DOMAIN_PART = String.raw`[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}`;
const EMAIL_FORMAT_REGEX = new RegExp(`^${EMAIL_LOCAL_PART}@${EMAIL_DOMAIN_PART}$`);

export const isValidEmailFormat = (email: string): boolean => EMAIL_FORMAT_REGEX.test(email);

/**
 * Factory to create email validator
 */
const createEmailValidator =
  <TFieldValues extends FieldValues>(t: (key: string) => string): Validate<string, TFieldValues> =>
  (email: string) => {
    const trimmed = email?.trim() || '';

    if (!trimmed) return t('sign_up.form.email_input.required');

    if (!isBasicEmailFormat(trimmed)) return t('sign_up.form.email_input.email_format_error');

    if (!isValidEmailFormat(trimmed)) return t('sign_up.form.email_input.invalid_message');

    return true;
  };
export default createEmailValidator;
