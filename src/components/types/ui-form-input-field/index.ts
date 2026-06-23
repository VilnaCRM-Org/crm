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

export type CustomTextField<T extends FieldValues> = TextFieldProps & {
  control: Control<T>;
  rules: Omit<
    RegisterOptions<T, Path<T>>,
    'disabled' | 'valueAsNumber' | 'valueAsDate' | 'setValueAs'
  >;
  defaultValue?: PathValue<T, Path<T>>;
  name: Path<T>;
};

export type RenderFieldArgs<T extends FieldValues> = {
  field: ControllerRenderProps<T, Path<T>>;
  fieldState: ControllerFieldState;
};

export type ControlledFieldProps<T extends FieldValues> = {
  control: Control<T>;
  rules: Omit<
    RegisterOptions<T, Path<T>>,
    'disabled' | 'valueAsNumber' | 'valueAsDate' | 'setValueAs'
  >;
  defaultValue?: PathValue<T, Path<T>>;
  name: Path<T>;
  sx: TextFieldProps['sx'];
  textFieldProps: Omit<CustomTextField<T>, 'control' | 'rules' | 'defaultValue' | 'name' | 'sx'>;
};
