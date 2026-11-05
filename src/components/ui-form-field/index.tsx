import { Grid } from '@mui/material';
import type { InputProps } from '@mui/material/Input';
import type { JSX } from 'react';
import { FieldValues, Path, PathValue, RegisterOptions, useFormContext } from 'react-hook-form';

import type { FormFieldProps, FormFieldSlotProps } from '@/components/types/ui-form-field';
import UIFormInputField from '@/components/ui-form-input-field';
import UITypography from '@/components/ui-typography';

import styles from './styles';

function useFieldSlotProps<T extends FieldValues>(
  name: Path<T>,
  inputProps: InputProps,
  describedBy: string | undefined
): FormFieldSlotProps {
  const { getFieldState, formState } = useFormContext<T>();
  if (describedBy === undefined) return { input: inputProps };
  const { error } = getFieldState(name, formState);
  const ids = error?.message ? `${describedBy} ${name}-helper-text` : describedBy;
  return { input: inputProps, htmlInput: { 'aria-describedby': ids } };
}

export default function UIFormField<T extends FieldValues>({
  rules = {} as RegisterOptions<T, Path<T>>,
  defaultValue = '' as unknown as PathValue<T, Path<T>>,
  name,
  placeholder,
  type,
  label,
  autoComplete,
  inputProps = {},
  describedBy,
  sx,
}: FormFieldProps<T>): JSX.Element {
  const { control } = useFormContext<T>();
  const slotProps = useFieldSlotProps<T>(name, inputProps, describedBy);

  return (
    <Grid container sx={{ flexDirection: 'column', ...sx }}>
      <UITypography sx={styles.formFieldLabel} component="label" htmlFor={name}>
        {label}
      </UITypography>
      <UIFormInputField
        control={control}
        rules={rules}
        defaultValue={defaultValue}
        name={name}
        id={name}
        placeholder={placeholder}
        type={type}
        autoComplete={autoComplete}
        sx={styles.formFieldInput}
        slotProps={slotProps}
      />
    </Grid>
  );
}
