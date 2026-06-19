import type { TFunction } from 'i18next';
import type { FieldValues } from 'react-hook-form';

import createEmailValidator from './email';
import type { Validators } from './index.types';
import createFullNameValidator from './name';
import createPasswordValidator from './password';

export const createValidators = <TFieldValues extends FieldValues>(
  t: TFunction
): Validators<TFieldValues> => ({
  email: createEmailValidator<TFieldValues>(t),
  password: createPasswordValidator<TFieldValues>(t),
  fullName: createFullNameValidator<TFieldValues>(t),
});
