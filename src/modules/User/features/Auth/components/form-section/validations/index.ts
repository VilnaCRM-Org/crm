import type { TFunction } from 'i18next';
import type { Validate, FieldValues } from 'react-hook-form';

import createEmailValidator from '@/modules/User/features/Auth/components/form-section/validations/email';
import createFullNameValidator from '@/modules/User/features/Auth/components/form-section/validations/name';
import createPasswordValidator from '@/modules/User/features/Auth/components/form-section/validations/password';

export type Validators<TFieldValues extends FieldValues> = {
  email: Validate<string, TFieldValues>;
  password: Validate<string, TFieldValues>;
  fullName: Validate<string, TFieldValues>;
};

export const createValidators = <TFieldValues extends FieldValues>(
  t: TFunction
): Validators<TFieldValues> => ({
  email: createEmailValidator<TFieldValues>(t),
  password: createPasswordValidator<TFieldValues>(t),
  fullName: createFullNameValidator<TFieldValues>(t),
});
