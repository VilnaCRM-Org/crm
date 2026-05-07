/* eslint-disable react/jsx-props-no-spreading */
import { TextField, ThemeProvider } from '@mui/material';
import { TextFieldProps } from '@mui/material/TextField';
import React from 'react';
import {
  Control,
  Controller,
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

export default function UIFormInputField<T extends FieldValues>({
  control,
  rules,
  defaultValue,
  name,
  sx,
  ...props
}: CustomTextField<T>): React.ReactElement {
  return (
    <ThemeProvider theme={theme}>
      <Controller
        name={name}
        control={control}
        {...(defaultValue !== undefined ? { defaultValue } : {})}
        rules={rules}
        render={({ field: { ref, ...field }, fieldState }): React.ReactElement => (
          <TextField
            {...props}
            {...field}
            inputRef={ref}
            error={fieldState.invalid}
            helperText={fieldState.error?.message ?? props.helperText}
            sx={sx}
          />
        )}
      />
    </ThemeProvider>
  );
}
