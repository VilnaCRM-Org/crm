import type { TFunction } from 'i18next';
import type { FieldValues } from 'react-hook-form';

import emailValidator from './email';
import type { Validators } from './index.types';
import fullNameValidator from './name';
import passwordValidator from './password';

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
