import { useForm } from 'react-hook-form';
import type { FieldValues } from 'react-hook-form';

import type { UseUIFormOptions, UseUIFormResult } from '@/components/types/ui-form';

export default function useUIForm<T extends FieldValues>({
  defaultValues,
  formOptions,
  isSubmitting,
}: UseUIFormOptions<T>): UseUIFormResult<T> {
  const methods = useForm<T>({ mode: 'onTouched', defaultValues, ...formOptions });
  const submitting = isSubmitting ?? methods.formState.isSubmitting;
  return { methods, submitting };
}
