import { Validate, FieldValues } from 'react-hook-form';

const isBasicEmailFormat = (email: string): boolean => /@/.test(email) && /\./.test(email);

export const isValidEmailFormat = (email: string): boolean =>
  /^[a-zA-Z0-9]([a-zA-Z0-9._%-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/.test(
    email
  );

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
