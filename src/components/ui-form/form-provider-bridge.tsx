import { FieldValues, FormProvider } from 'react-hook-form';

import type { FormProviderBridgeProps } from './form-provider-bridge.types';

export default function FormProviderBridge<T extends FieldValues>({
  methods,
  children,
}: FormProviderBridgeProps<T>): JSX.Element {
  // Forwards every UseFormReturn field so FormProvider types stay satisfied
  // across react-hook-form v7.57+, including subscribe support.
  return (
    <FormProvider
      watch={methods.watch}
      getValues={methods.getValues}
      getFieldState={methods.getFieldState}
      setError={methods.setError}
      clearErrors={methods.clearErrors}
      setValue={methods.setValue}
      trigger={methods.trigger}
      formState={methods.formState}
      resetField={methods.resetField}
      reset={methods.reset}
      handleSubmit={methods.handleSubmit}
      unregister={methods.unregister}
      control={methods.control}
      register={methods.register}
      setFocus={methods.setFocus}
      subscribe={methods.subscribe}
    >
      {children}
    </FormProvider>
  );
}
