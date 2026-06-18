import type { TFunction } from 'i18next';
import { FieldValues, Validate } from 'react-hook-form';

type ValidationPswdMessageKey =
  | 'invalidLength'
  | 'numberRequired'
  | 'uppercaseRequired'
  | 'lowercaseRequired'
  | 'fieldRequired';

type Rule = { check: (value: string) => boolean; key: ValidationPswdMessageKey };

class PasswordValidator {
  private readonly rules: Rule[] = [
    { check: (v) => v.length >= 8 && v.length <= 64, key: 'invalidLength' },
    { check: (v) => /[0-9]/.test(v), key: 'numberRequired' },
    { check: (v) => /\p{Lu}/u.test(v), key: 'uppercaseRequired' },
    { check: (v) => /\p{Ll}/u.test(v), key: 'lowercaseRequired' },
  ];

  public create<TFieldValues extends FieldValues>(t: TFunction): Validate<string, TFieldValues> {
    return (value: string) => this.run(value, this.buildMessages(t));
  }

  private buildMessages(t: TFunction): Record<ValidationPswdMessageKey, string> {
    return {
      invalidLength: t('sign_up.form.password_input.error_length'),
      numberRequired: t('sign_up.form.password_input.error_numbers'),
      uppercaseRequired: t('sign_up.form.password_input.error_uppercase'),
      lowercaseRequired: t('sign_up.form.password_input.error_lowercase'),
      fieldRequired: t('sign_up.form.password_input.required'),
    };
  }

  private run(value: string, messages: Record<ValidationPswdMessageKey, string>): string | true {
    if (!value?.trim()) return messages.fieldRequired;
    const failed = this.rules.find((r) => !r.check(value));
    return failed ? messages[failed.key] : true;
  }
}

const passwordValidator = new PasswordValidator();

export default passwordValidator;
