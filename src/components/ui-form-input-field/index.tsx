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

import theme from './theme';

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
  autoComplete,
  control,
  helperText,
  rules,
  defaultValue = undefined,
  name,
  placeholder,
  slotProps,
  sx,
  type,
}: CustomTextField<T>): React.ReactElement {
  return (
    <ThemeProvider theme={theme}>
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue as PathValue<T, Path<T>>}
        rules={rules}
        render={({ field, fieldState }): React.ReactElement => (
          <TextField
            autoComplete={autoComplete}
            error={fieldState.invalid}
            helperText={fieldState.error?.message ?? helperText}
            inputRef={field.ref}
            name={field.name}
            onBlur={field.onBlur}
            onChange={field.onChange}
            placeholder={placeholder}
            slotProps={slotProps}
            sx={sx}
            type={type}
            value={field.value ?? ''}
          />
        )}
      />
    </ThemeProvider>
  );
}
