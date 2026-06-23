import type { ReactNode } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

export type FormProviderBridgeProps<T extends FieldValues> = {
  methods: UseFormReturn<T>;
  children: ReactNode;
};
