import type { TFunction } from 'i18next';

import type { createValidators } from '@auth/components/form-section/validations';

export type Props = {
  t: TFunction;
  validators: ReturnType<typeof createValidators>;
};
