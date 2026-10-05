import type { Decorator } from '@storybook/react-webpack5';
import { type JSX, type ReactNode, useEffect } from 'react';
import { type FieldValues, FormProvider, useForm } from 'react-hook-form';

type FormFrameProps = {
  defaultValues: FieldValues;
  validateOnMount: boolean;
  children: ReactNode;
};

function FormFrame({ defaultValues, validateOnMount, children }: FormFrameProps): JSX.Element {
  const methods = useForm({ defaultValues, mode: 'onTouched' });
  const { trigger } = methods;

  useEffect(() => {
    if (validateOnMount) void trigger();
  }, [validateOnMount, trigger]);

  return <FormProvider {...methods}>{children}</FormProvider>;
}

export function withFormProvider(
  defaultValues: FieldValues,
  { validateOnMount = false }: { validateOnMount?: boolean } = {}
): Decorator {
  return function FormProviderDecorator(Story): JSX.Element {
    return (
      <FormFrame defaultValues={defaultValues} validateOnMount={validateOnMount}>
        <Story />
      </FormFrame>
    );
  };
}
