import type { FieldValues } from 'react-hook-form';

import type { UIFormProps } from '@/components/types/ui-form';

export type ConfirmationShell = Pick<
  UIFormProps<FieldValues>,
  'error' | 'errorAction' | 'errorOccurrence' | 'titleRef' | 'submitRef'
>;
