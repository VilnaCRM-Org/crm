import { FieldValues, FormProvider } from 'react-hook-form';

import type { FormProviderBridgeProps } from '@/components/types/ui-form/form-provider-bridge';

export default function FormProviderBridge<T extends FieldValues>({
  methods,
  children,
}: FormProviderBridgeProps<T>): JSX.Element {
  return <FormProvider<T> {...methods}>{children}</FormProvider>;
}
