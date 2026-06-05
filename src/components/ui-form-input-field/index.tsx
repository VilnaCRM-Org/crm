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
  defaultValue?: PathValue<T, Path<T>>;
  name: Path<T>;
};

type RenderFieldArgs<T extends FieldValues> = {
  field: ControllerRenderProps<T, Path<T>>;
  fieldState: ControllerFieldState;
};

type ControlledFieldProps<T extends FieldValues> = {
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

function createRenderField<T extends FieldValues>(
  sx: TextFieldProps['sx'],
  textFieldProps: ControlledFieldProps<T>['textFieldProps']
): (args: RenderFieldArgs<T>) => React.ReactElement {
  return function fieldView({
    field: { ref, ...field },
    fieldState,
  }: RenderFieldArgs<T>): React.ReactElement {
    return (
      <TextField
        {...textFieldProps}
        {...field}
        inputRef={ref}
        error={fieldState.invalid}
        helperText={fieldState.error?.message ?? textFieldProps.helperText}
        sx={sx}
      />
    );
  };
}

function ControlledField<T extends FieldValues>({
  control,
  rules,
  defaultValue,
  name,
  sx,
  textFieldProps,
}: ControlledFieldProps<T>): React.ReactElement {
  const view = createRenderField<T>(sx, textFieldProps);

  if (defaultValue !== undefined) {
    return (
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        rules={rules}
        render={view}
      />
    );
  }

  return <Controller name={name} control={control} rules={rules} render={view} />;
}

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
      <ControlledField
        control={control}
        rules={rules}
        defaultValue={defaultValue}
        name={name}
        sx={sx}
        textFieldProps={props}
      />
    </ThemeProvider>
  );
}
