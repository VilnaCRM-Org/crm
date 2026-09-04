import type { RegisterUserDto } from '@auth/types/credentials';
import loadIsolated from '@tests/unit/utils/isolated-module';

import emptyUser from './constants';

type FullNameValidator =
  (typeof import('@auth/components/form-section/validations/name'))['default'];

const t = (key: string): string => key;

/**
 * The separator pattern is compiled into a `RegExp` at import time and the rule table is an
 * instance field of the module singleton, so both are evaluated before any test body runs when
 * the module is imported at file scope. A fresh registry per test puts them under the assertion.
 */
const loadFullNameValidator = (): Promise<FullNameValidator> =>
  loadIsolated(
    async () => (await import('@auth/components/form-section/validations/name')).default
  );

const loadValidate = async (): Promise<(value: string, values: RegisterUserDto) => unknown> => {
  const fullNameValidator = await loadFullNameValidator();
  return fullNameValidator.create<RegisterUserDto>(t);
};

describe('full name separator pattern', () => {
  it('rejects a name containing digits', async () => {
    const fullNameValidator = await loadFullNameValidator();

    expect(fullNameValidator.isLettersOnly('John3')).toBe(false);
  });

  it('rejects a name containing punctuation that is not a name separator', async () => {
    const fullNameValidator = await loadFullNameValidator();

    expect(fullNameValidator.isLettersOnly('John.Doe')).toBe(false);
  });

  it('accepts letters joined by the allowed separators', async () => {
    const fullNameValidator = await loadFullNameValidator();

    expect(fullNameValidator.isLettersOnly("Jean-Claude O'Brien")).toBe(true);
  });
});

describe('full name rule message keys', () => {
  it('reports the required key for an empty value', async () => {
    const validate = await loadValidate();

    expect(validate('', emptyUser)).toBe('sign_up.form.name_input.required');
  });

  it('reports the required key for a whitespace-only value', async () => {
    const validate = await loadValidate();

    expect(validate('   ', emptyUser)).toBe('sign_up.form.name_input.required');
  });

  it('reports the special-characters key for a value with a digit', async () => {
    const validate = await loadValidate();

    expect(validate('John3 Doe', emptyUser)).toBe(
      'sign_up.form.name_input.special_characters_error'
    );
  });

  it('reports the format key for a single letters-only word', async () => {
    const validate = await loadValidate();

    expect(validate('John', emptyUser)).toBe('sign_up.form.name_input.full_name_format_error');
  });

  it('accepts a well-formed full name', async () => {
    const validate = await loadValidate();

    expect(validate('John Doe', emptyUser)).toBe(true);
  });
});
