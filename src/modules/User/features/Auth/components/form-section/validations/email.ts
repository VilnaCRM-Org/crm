import { Validate, FieldValues } from 'react-hook-form';

const isBasicEmailFormat = (email: string): boolean => /@/.test(email) && /\./.test(email);

export const isValidEmailFormat = (email: string): boolean =>
  /^[a-zA-Z0-9]([a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/.test(
    email
  );

type Rule = { check: (email: string) => boolean; messageKey: string };

const emailRules: Rule[] = [
  { check: (v) => v.length > 0, messageKey: 'sign_up.form.email_input.required' },
  { check: isBasicEmailFormat, messageKey: 'sign_up.form.email_input.email_format_error' },
  { check: isValidEmailFormat, messageKey: 'sign_up.form.email_input.invalid_message' },
];

function runEmailValidation(trimmed: string, t: (key: string) => string): string | true {
  const failed = emailRules.find((r) => !r.check(trimmed));
  return failed ? t(failed.messageKey) : true;
}

const createEmailValidator =
  <TFieldValues extends FieldValues>(t: (key: string) => string): Validate<string, TFieldValues> =>
  (email: string) =>
    runEmailValidation(email?.trim() || '', t);

export default createEmailValidator;
