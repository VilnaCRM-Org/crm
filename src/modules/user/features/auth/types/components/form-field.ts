import type { InputProps } from '@mui/material/Input';
import type { InputHTMLAttributes } from 'react';
import type { FieldValues, Path, PathValue, RegisterOptions } from 'react-hook-form';

export interface FormFieldProps<T extends FieldValues = FieldValues> {
  rules: RegisterOptions<T, Path<T>>;
  name: Path<T>;
  placeholder: string;
  type: InputHTMLAttributes<HTMLInputElement>['type'];
  label: string;
  autoComplete: string;
  defaultValue?: PathValue<T, Path<T>>;
  inputProps?: InputProps;
}
