import type { InputBaseComponentProps } from '@mui/material/InputBase';
import type { OutlinedInputProps } from '@mui/material/OutlinedInput';
import type { BaseTextFieldProps } from '@mui/material/TextField';
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

export type FormTextFieldInputSlotProps = Pick<OutlinedInputProps, 'endAdornment' | 'readOnly'>;

export interface FormTextFieldSlotProps {
  input?: FormTextFieldInputSlotProps | undefined;
  htmlInput?: InputBaseComponentProps | undefined;
}

export interface FormTextFieldProps extends Pick<
  BaseTextFieldProps,
  | 'autoComplete'
  | 'disabled'
  | 'error'
  | 'fullWidth'
  | 'id'
  | 'inputRef'
  | 'name'
  | 'onBlur'
  | 'onFocus'
  | 'placeholder'
  | 'required'
  | 'sx'
  | 'type'
  | 'value'
> {
  helperText?: string | undefined;
  label?: string | undefined;
  onChange?: OutlinedInputProps['onChange'] | undefined;
  slotProps?: FormTextFieldSlotProps | undefined;
}

export interface TextFieldInputProps {
  field: FormTextFieldProps;
  id: string;
  describedBy: string | undefined;
}

export interface CustomTextFieldOwnProps<T extends FieldValues> {
  control: Control<T>;
  rules: FieldRules<T>;
  defaultValue?: PathValue<T, Path<T>> | undefined;
  name: Path<T>;
}

export type CustomTextField<T extends FieldValues> = FormTextFieldProps &
  CustomTextFieldOwnProps<T>;

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

export interface FormTextFieldViewProps {
  readonly field: FormTextFieldProps;
}
