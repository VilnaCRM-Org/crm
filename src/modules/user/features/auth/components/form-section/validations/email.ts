import { Validate, FieldValues } from 'react-hook-form';

type Rule = { check: (email: string) => boolean; messageKey: string };

const EMAIL_LOCAL_PART = /[a-zA-Z0-9]([a-zA-Z0-9._%+-]*[a-zA-Z0-9])?/;
const EMAIL_DOMAIN_PART = /[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}/;
const VALID_EMAIL_RE = new RegExp(`^${EMAIL_LOCAL_PART.source}@${EMAIL_DOMAIN_PART.source}$`);

class EmailValidator {
  private readonly rules: Rule[] = [
    { check: (v) => v.length > 0, messageKey: 'sign_up.form.email_input.required' },
    {
      check: (v) => this.isBasicFormat(v),
      messageKey: 'sign_up.form.email_input.email_format_error',
    },
    { check: (v) => this.isValidFormat(v), messageKey: 'sign_up.form.email_input.invalid_message' },
  ];

  public isValidFormat(email: string): boolean {
    return VALID_EMAIL_RE.test(email);
  }

  public create<TFieldValues extends FieldValues>(
    t: (key: string) => string
  ): Validate<string, TFieldValues> {
    return (email: string) => this.run(email?.trim() || '', t);
  }

  private isBasicFormat(email: string): boolean {
    return /@/.test(email) && /\./.test(email);
  }

  private run(trimmed: string, t: (key: string) => string): string | true {
    const failed = this.rules.find((r) => !r.check(trimmed));
    return failed ? t(failed.messageKey) : true;
  }
}

const emailValidator = new EmailValidator();

export default emailValidator;
