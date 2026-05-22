import { TextField, ThemeProvider } from '@mui/material';
import { TextFieldProps } from '@mui/material/TextField';
import React from 'react';
import {
  Control,
  Controller,
  ControllerFieldState,
  ControllerRenderProps,
  FieldValues,
  Path,
  PathValue,
  RegisterOptions,
} from 'react-hook-form';

import theme from '@/components/ui-form-input-field/theme';

type CustomTextField<T extends FieldValues> = TextFieldProps & {
  control: Control<T>;
  rules: Omit<
    RegisterOptions<T, Path<T>>,
    'disabled' | 'valueAsNumber' | 'valueAsDate' | 'setValueAs'
  >;
  defaultValue: PathValue<T, Path<T>> | undefined;
  name: Path<T>;
};

type RenderFieldArgs<T extends FieldValues> = {
  field: ControllerRenderProps<T, Path<T>>;
  fieldState: ControllerFieldState;
};

export default function UIFormInputField<T extends FieldValues>({
  control,
  rules,
  defaultValue,
  name,
  sx,
  ...props
}: CustomTextField<T>): React.ReactElement {
  const renderField = ({
    field: { ref, ...field },
    fieldState,
  }: RenderFieldArgs<T>): React.ReactElement => (
    <TextField
      {...props}
      {...field}
      inputRef={ref}
      error={fieldState.invalid}
      helperText={fieldState.error?.message ?? props.helperText}
      sx={sx}
    />
  );

  return (
    <ThemeProvider theme={theme}>
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        rules={rules}
        render={renderField}
      />
    </ThemeProvider>
  );
}
