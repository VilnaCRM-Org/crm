/* eslint-disable react/jsx-props-no-spreading */
import { TextField, ThemeProvider } from '@mui/material';
import { TextFieldProps } from '@mui/material/TextField';
import React from 'react';
import {
  Control,
  FieldValues,
  Path,
  PathValue,
  RegisterOptions,
  useController,
} from 'react-hook-form';

import theme from './Theme';

type CustomTextField<T extends FieldValues> = TextFieldProps & {
  control: Control<T>;
  rules: Omit<
    RegisterOptions<T, Path<T>>,
    'disabled' | 'valueAsNumber' | 'valueAsDate' | 'setValueAs'
  >;
  defaultValue: PathValue<T, Path<T>> | undefined;
  name: Path<T>;
};

export default function UIFormInputField<T extends FieldValues>({
  control,
  rules,
  defaultValue = undefined,
  name,
  sx,
  ...props
}: CustomTextField<T>): React.ReactElement {
  const { field, fieldState } = useController({
    name,
    control,
    defaultValue: defaultValue as PathValue<T, Path<T>>,
    rules,
  });

  return (
    <ThemeProvider theme={theme}>
      <TextField
        {...props}
        {...field}
        inputRef={field.ref}
        error={fieldState.invalid}
        helperText={fieldState.error?.message ?? props.helperText}
        sx={sx}
      />
    </ThemeProvider>
  );
}
