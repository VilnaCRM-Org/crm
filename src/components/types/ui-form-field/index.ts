import type { InputProps } from '@mui/material/Input';
import type { Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';
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
  describedBy?: string | undefined;
  sx?: SystemStyleObject<Theme> | undefined;
}

export interface FormFieldHtmlInputProps {
  'aria-describedby': string;
}

export interface FormFieldSlotProps {
  input: InputProps;
  htmlInput?: FormFieldHtmlInputProps;
}
