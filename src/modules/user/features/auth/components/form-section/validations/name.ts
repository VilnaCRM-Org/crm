import type { FieldValues, Validate } from 'react-hook-form';

import type { NameRule } from '@auth/types/validations/name';

const MAX_FULL_NAME_LENGTH = 255;
const ALLOWED_NAME_CHARACTERS = '[A-Za-zА-Яа-яІіЇїЄєҐґ]';
const NAME_SEPARATORS = `[\\s'-]`;
const SINGLE_NAME_PATTERN = `${ALLOWED_NAME_CHARACTERS}+`;
const NAME_SEP_GROUP = `(?:${NAME_SEPARATORS}${SINGLE_NAME_PATTERN})`;
const NAME_WITH_SEPARATORS_PATTERN = `${SINGLE_NAME_PATTERN}${NAME_SEP_GROUP}*`;
const FULL_NAME_PATTERN = `${SINGLE_NAME_PATTERN}${NAME_SEP_GROUP}+`;

const NAME_WITH_SEPARATORS_RE = new RegExp(`^${NAME_WITH_SEPARATORS_PATTERN}$`);
const FULL_NAME_RE = new RegExp(`^${FULL_NAME_PATTERN}$`);

class FullNameValidator {
  private readonly rules: NameRule[] = [
    { check: (v) => !this.isEmpty(v), messageKey: 'sign_up.form.name_input.required' },
    {
      check: (v) => this.isLettersOnly(v.trim()),
      messageKey: 'sign_up.form.name_input.special_characters_error',
    },
    {
      check: (v) => this.isFormatted(v.trim()),
      messageKey: 'sign_up.form.name_input.full_name_format_error',
    },
  ];

  public isLettersOnly(value: string): boolean {
    return NAME_WITH_SEPARATORS_RE.test(value);
  }

  public isFormatted(value: string): boolean {
    return FULL_NAME_RE.test(value) && value.length >= 2 && value.length <= MAX_FULL_NAME_LENGTH;
  }

  public isEmpty(value: string): boolean {
    return value.trim().length === 0;
  }

  public create<TFieldValues extends FieldValues>(
    t: (key: string) => string
  ): Validate<string, TFieldValues> {
    return (fullName: string) => this.run(fullName || '', t);
  }

  private run(input: string, t: (key: string) => string): string | true {
    const failed = this.rules.find((r) => !r.check(input));
    return failed ? t(failed.messageKey) : true;
  }
}

const fullNameValidator = new FullNameValidator();

export default fullNameValidator;
