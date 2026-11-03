import type { Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';
import type { InputHTMLAttributes } from 'react';
import type { FieldValues, Path, PathValue, RegisterOptions } from 'react-hook-form';

import type { FormTextFieldInputSlotProps } from '@/components/types/ui-form-input-field';

export interface FormFieldProps<T extends FieldValues = FieldValues> {
  rules: RegisterOptions<T, Path<T>>;
  name: Path<T>;
  placeholder: string;
  type: InputHTMLAttributes<HTMLInputElement>['type'];
  label: string;
  autoComplete: string;
  defaultValue?: PathValue<T, Path<T>>;
  inputProps?: FormTextFieldInputSlotProps;
  describedBy?: string | undefined;
  sx?: SystemStyleObject<Theme> | undefined;
}

export interface FormFieldHtmlInputProps {
  'aria-describedby': string;
}

export interface FormFieldSlotProps {
  input: FormTextFieldInputSlotProps;
  htmlInput?: FormFieldHtmlInputProps;
}
