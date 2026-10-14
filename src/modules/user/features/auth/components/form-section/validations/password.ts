import type { TFunction } from 'i18next';
import { FieldValues, Validate } from 'react-hook-form';

import type {
  PasswordRuleResult,
  PasswordRuleResultSet,
  Rule,
  ValidationPswdMessageKey,
} from '@auth/types/validations/password';

class PasswordValidator {
  private readonly rules: Rule[] = [
    { pattern: /^[^\n\r\u2028\u2029]{8,64}$/u, key: 'invalidLength' },
    { pattern: /[0-9]/, key: 'numberRequired' },
    { pattern: /[A-Z]/, key: 'uppercaseRequired' },
    { pattern: /\p{Ll}/u, key: 'lowercaseRequired' },
  ];

  private readonly lineBreakRule: Rule<'lineBreakForbidden'> = {
    pattern: /^[^\n\r\u2028\u2029]*$/u,
    key: 'lineBreakForbidden',
  };

  public create<TFieldValues extends FieldValues>(t: TFunction): Validate<string, TFieldValues> {
    return (value: string) => this.run(value, this.buildMessages(t));
  }

  public evaluate(value: string): PasswordRuleResultSet {
    const items: PasswordRuleResult[] = [];
    for (const rule of this.rules) items.push({ key: rule.key, met: rule.pattern.test(value) });
    return { items };
  }

  private buildMessages(t: TFunction): Record<ValidationPswdMessageKey, string> {
    return {
      invalidLength: t('sign_up.form.password_input.error_length'),
      numberRequired: t('sign_up.form.password_input.error_numbers'),
      uppercaseRequired: t('sign_up.form.password_input.error_uppercase'),
      lowercaseRequired: t('sign_up.form.password_input.error_lowercase'),
      lineBreakForbidden: t('sign_up.form.password_input.error_line_break'),
      fieldRequired: t('sign_up.form.password_input.required'),
    };
  }

  private run(value: string, messages: Record<ValidationPswdMessageKey, string>): string | true {
    if (!value?.trim()) return messages.fieldRequired;
    const failed = [this.lineBreakRule, ...this.rules].find((r) => !r.pattern.test(value));
    return failed ? messages[failed.key] : true;
  }
}

const passwordValidator = new PasswordValidator();

export default passwordValidator;
