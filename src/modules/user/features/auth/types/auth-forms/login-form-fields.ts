import type { TFunction } from 'i18next';

import type formValidators from '@auth/components/form-section/validations';

export interface Props {
  t: TFunction;
  validators: ReturnType<typeof formValidators.create>;
}
