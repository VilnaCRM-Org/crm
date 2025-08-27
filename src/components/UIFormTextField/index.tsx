/* eslint-disable react/jsx-props-no-spreading */
import { SxProps, TextField, ThemeProvider } from '@mui/material';
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

import styles from './styles';
import Theme from './Theme';

interface CustomTextField<T extends FieldValues> extends TextFieldProps<'standard'> {
  control: Control<T>;
  rules: Omit<
    RegisterOptions<T, Path<T>>,
    'disabled' | 'valueAsNumber' | 'valueAsDate' | 'setValueAs'
  >;
  defaultValue: PathValue<T, Path<T>>;
  name: Path<T>;
  sx: SxProps<typeof Theme>;
}

export default function UIFormTextField<T extends FieldValues>({
  control,
  rules,
  defaultValue,
  name,
  sx,
  ...props
}: CustomTextField<T>): React.ReactElement {
  return (
    <ThemeProvider theme={Theme}>
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        rules={rules}
        render={({ field, fieldState }): React.ReactElement => (
          <TextField
            {...field}
            {...props}
            error={fieldState.invalid}
            helperText={fieldState.error?.message}
            sx={[styles.textField, sx]}
          />
        )}
      />
    </ThemeProvider>
  );
}
