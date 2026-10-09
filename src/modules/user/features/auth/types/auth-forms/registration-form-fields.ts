import type { TFunction } from 'i18next';

import type formValidators from '@auth/components/form-section/validations';

export type Validators = ReturnType<typeof formValidators.create>;

export interface RegistrationFormFieldsProps {
  t: TFunction;
  validators: Validators;
}
