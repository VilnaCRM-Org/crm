import { ThemeProvider, TextField } from '@mui/material';
import { TextFieldProps } from '@mui/material/TextField';
import React from 'react';
import { Controller, useController, Control, FieldValues, PathValue, Path, RegisterOptions } from 'react-hook-form';

import Theme from './Theme';

interface CustomTextField<T extends FieldValues> extends TextFieldProps<'standard'>{
  control: Control<T>;
  rules: Omit<RegisterOptions<T, Path<T>>, 'disabled' | 'valueAsNumber' | 'valueAsDate' | 'setValueAs'>;
  defaultValue: PathValue<T, Path<T>>;
  name: Path<T>;
}

export default function UIFormTextField<T extends FieldValues> ({ control, rules, defaultValue, name, ...props }: CustomTextField<T>): React.ReactElement {
  const {
    field: { ref, ...inputProps },
    fieldState: { invalid, error },
  } = useController({name, control, defaultValue});

  return (
    <ThemeProvider theme={Theme}>
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        rules={rules}
        render={({ field }) => (
          // eslint-disable-next-line react/jsx-props-no-spreading
            <TextField {...field} {...props} {...inputProps} inputRef={ref} error={invalid} helperText={error?.message} />
          )}
      />
    </ThemeProvider>
  );
}
