import type { TFunction } from 'i18next';
import type { Validate, FieldValues } from 'react-hook-form';

import emailValidator from './email';
import fullNameValidator from './name';
import passwordValidator from './password';

export type Validators<TFieldValues extends FieldValues> = {
  email: Validate<string, TFieldValues>;
  password: Validate<string, TFieldValues>;
  fullName: Validate<string, TFieldValues>;
};

class FormValidators {
  public create<TFieldValues extends FieldValues>(t: TFunction): Validators<TFieldValues> {
    return {
      email: emailValidator.create<TFieldValues>(t),
      password: passwordValidator.create<TFieldValues>(t),
      fullName: fullNameValidator.create<TFieldValues>(t),
    };
  }
}

const formValidators = new FormValidators();

export default formValidators;
