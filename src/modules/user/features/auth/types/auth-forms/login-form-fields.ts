import type { TFunction } from 'i18next';

import type formValidators from '@auth/components/form-section/validations';

export type Props = {
  t: TFunction;
  validators: ReturnType<typeof formValidators.create>;
};
