import type { TFunction } from 'i18next';

import type formValidators from '@/modules/user/lib/validations';

export interface Props {
  t: TFunction;
  validators: ReturnType<typeof formValidators.create>;
}
