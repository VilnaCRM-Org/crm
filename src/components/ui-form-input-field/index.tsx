import FormHelperText from '@mui/material/FormHelperText';
import OutlinedInput from '@mui/material/OutlinedInput';
import type { OutlinedInputProps } from '@mui/material/OutlinedInput';
import { ThemeProvider } from '@mui/material/styles';
import React, { useId } from 'react';
import {
  Control,
  Controller,
  FieldValues,
  Path,
  PathValue,
  RegisterOptions,
} from 'react-hook-form';

import theme from '@/components/ui-form-input-field/theme';

type CustomTextField<T extends FieldValues> = {
  autoComplete?: string;
  control: Control<T>;
  endAdornment?: OutlinedInputProps['endAdornment'];
  helperText?: React.ReactNode;
  rules: Omit<
    RegisterOptions<T, Path<T>>,
    'disabled' | 'valueAsNumber' | 'valueAsDate' | 'setValueAs'
  >;
  defaultValue?: PathValue<T, Path<T>> | undefined;
  name: Path<T>;
  placeholder?: string;
  startAdornment?: OutlinedInputProps['startAdornment'];
  sx?: OutlinedInputProps['sx'];
  type?: OutlinedInputProps['type'];
};

export default function UIFormInputField<T extends FieldValues>({
  autoComplete,
  control,
  endAdornment,
  helperText,
  rules,
  defaultValue = undefined,
  name,
  placeholder,
  startAdornment,
  sx,
  type,
}: CustomTextField<T>): React.ReactElement {
  const helperTextId = useId();

  return (
    <ThemeProvider theme={theme}>
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue as PathValue<T, Path<T>>}
        rules={rules}
        render={({ field, fieldState }): React.ReactElement => {
          const resolvedHelperText = fieldState.error?.message ?? helperText;

          return (
            <>
              <OutlinedInput
                aria-describedby={resolvedHelperText ? helperTextId : undefined}
                autoComplete={autoComplete}
                endAdornment={endAdornment}
                error={fieldState.invalid}
                fullWidth
                inputRef={field.ref}
                name={field.name}
                onBlur={field.onBlur}
                onChange={field.onChange}
                placeholder={placeholder}
                startAdornment={startAdornment}
                sx={sx}
                type={type}
                value={field.value ?? ''}
              />
              {resolvedHelperText ? (
                <FormHelperText error={fieldState.invalid} id={helperTextId}>
                  {resolvedHelperText}
                </FormHelperText>
              ) : null}
            </>
          );
        }}
      />
    </ThemeProvider>
  );
}
