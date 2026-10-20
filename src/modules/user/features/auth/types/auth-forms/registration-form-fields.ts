import type { TFunction } from 'i18next';

import type formValidators from '@/modules/user/lib/validations';

export type Validators = ReturnType<typeof formValidators.create>;

export interface RegistrationFormFieldsProps {
  t: TFunction;
  validators: Validators;
}
