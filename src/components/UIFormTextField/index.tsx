import { ThemeProvider, TextField } from "@mui/material";
import { TextFieldProps } from "@mui/material/TextField";
import React from 'react';
import { Controller, useController } from "react-hook-form";

import Theme from './Theme';

interface ICustomTextField extends TextFieldProps<'standard'>{
  control: any,
  rules: any,
  defaultValue: string,
  name: string,
}

export default function UIFormTextField ({ control, rules, defaultValue, name, ...props }: ICustomTextField) {
  const {
    field: { ref, ...inputProps },
    fieldState: { invalid, error },
  } = useController({name, control, defaultValue});

  return (
    <ThemeProvider theme={Theme}>
      <Controller
        name="firstAndLastName"
        control={control}
        defaultValue=""
        rules={rules}
        render={({ field }) => (
            <TextField
              {...field}
              {...props}
              {...inputProps}
              inputRef={ref}
              error={invalid}
              helperText={error?.message}
            />
          )}
      />
    </ThemeProvider>
  );
}
