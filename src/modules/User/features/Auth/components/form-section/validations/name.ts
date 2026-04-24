import { FieldValues, Validate } from 'react-hook-form';

const MAX_FULL_NAME_LENGTH = 255;
const ALLOWED_NAME_CHARACTERS = '[A-Za-zА-Яа-яІіЇїЄєҐґ]';
const NAME_SEPARATORS = `[\\s'-]`;
const SINGLE_NAME_PATTERN = `${ALLOWED_NAME_CHARACTERS}+`;
const NAME_WITH_SEPARATORS_PATTERN = `${SINGLE_NAME_PATTERN}(?:${NAME_SEPARATORS}${SINGLE_NAME_PATTERN})*`;
const FULL_NAME_PATTERN = `${SINGLE_NAME_PATTERN}(?:${NAME_SEPARATORS}${SINGLE_NAME_PATTERN})+`;

type ValidationFunction = (value: string) => boolean;
type ValidationKeys = 'isLettersOnly' | 'isFormatted' | 'isEmpty';

export const fullNameValidators: Record<ValidationKeys, ValidationFunction> = {
  isLettersOnly: (value) => new RegExp(`^${NAME_WITH_SEPARATORS_PATTERN}$`).test(value),
  isFormatted: (value) =>
    new RegExp(`^${FULL_NAME_PATTERN}$`).test(value) &&
    value.length >= 2 &&
    value.length <= MAX_FULL_NAME_LENGTH,
  isEmpty: (value) => value.trim().length === 0,
};

type NameRule = { check: (value: string) => boolean; messageKey: string };

const nameRules: NameRule[] = [
  {
    check: (v) => !fullNameValidators.isEmpty(v),
    messageKey: 'sign_up.form.name_input.required',
  },
  {
    check: (v) => fullNameValidators.isLettersOnly(v.trim()),
    messageKey: 'sign_up.form.name_input.special_characters_error',
  },
  {
    check: (v) => fullNameValidators.isFormatted(v.trim()),
    messageKey: 'sign_up.form.name_input.full_name_format_error',
  },
];

function runNameValidation(input: string, t: (key: string) => string): string | true {
  const failed = nameRules.find((r) => !r.check(input));
  return failed ? t(failed.messageKey) : true;
}

const createFullNameValidator =
  <TFieldValues extends FieldValues>(t: (key: string) => string): Validate<string, TFieldValues> =>
  (fullName: string) =>
    runNameValidation(fullName || '', t);

export default createFullNameValidator;
