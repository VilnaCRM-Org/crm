import type { TextFieldProps } from '@mui/material/TextField';
import type {
  Control,
  ControllerFieldState,
  ControllerRenderProps,
  FieldValues,
  Path,
  PathValue,
  RegisterOptions,
} from 'react-hook-form';

export type FieldRules<T extends FieldValues> = Omit<
  RegisterOptions<T, Path<T>>,
  'disabled' | 'valueAsNumber' | 'valueAsDate' | 'setValueAs'
>;

export interface CustomTextFieldOwnProps<T extends FieldValues> {
  control: Control<T>;
  rules: FieldRules<T>;
  defaultValue?: PathValue<T, Path<T>> | undefined;
  name: Path<T>;
}

export type CustomTextField<T extends FieldValues> = TextFieldProps & CustomTextFieldOwnProps<T>;

export type ForwardedTextFieldProps<T extends FieldValues> = Omit<
  CustomTextField<T>,
  'control' | 'rules' | 'defaultValue' | 'name'
>;

export interface RenderFieldArgs<T extends FieldValues> {
  field: ControllerRenderProps<T, Path<T>>;
  fieldState: ControllerFieldState;
}

export interface ControlledFieldProps<T extends FieldValues> {
  control: Control<T>;
  rules: FieldRules<T>;
  defaultValue?: PathValue<T, Path<T>> | undefined;
  name: Path<T>;
  textFieldProps: ForwardedTextFieldProps<T>;
}
