import type { ReactNode } from 'react';
import type {
  Control,
  ControllerFieldState,
  ControllerRenderProps,
  FieldPathByValue,
  FieldValues,
  Path,
} from 'react-hook-form';

import type { FieldRules } from '@/components/types/ui-form-input-field';

export type PinRequiredRule = FieldRules<FieldValues>['required'];

export type PinCellLabel = (cell: number) => string;

export interface PinFocusTarget {
  focus: () => void;
}

export interface UIPinInputProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPathByValue<T, string>;
  rules: FieldRules<T>;
  label: string;
  cellLabel: PinCellLabel;
  helperText?: ReactNode | undefined;
  error?: boolean | undefined;
  disabled?: boolean | undefined;
  id?: string | undefined;
}

export interface PinFieldProps<T extends FieldValues> extends Omit<
  UIPinInputProps<T>,
  'control' | 'name' | 'rules'
> {
  field: ControllerRenderProps<T, Path<T>>;
  fieldState: ControllerFieldState;
  required: boolean;
}
