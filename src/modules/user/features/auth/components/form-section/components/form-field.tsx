import { Grid } from '@mui/material';
import { FieldValues, Path, PathValue, RegisterOptions, useFormContext } from 'react-hook-form';

import UIFormInputField from '@/components/ui-form-input-field';
import UITypography from '@/components/ui-typography';

import type { FormFieldProps } from './form-field.types';
import styles from './styles';

export default function FormField<T extends FieldValues>({
  rules = {} as RegisterOptions<T, Path<T>>,
  defaultValue = '' as unknown as PathValue<T, Path<T>>,
  name,
  placeholder,
  type,
  label,
  autoComplete,
  inputProps = {},
}: FormFieldProps<T>): JSX.Element {
  const { control } = useFormContext<T>();

  return (
    <Grid container flexDirection="column" sx={styles.formFieldWrapper}>
      <UITypography sx={styles.formFieldLabel} component="label" htmlFor={name}>
        {label}
      </UITypography>
      <UIFormInputField
        control={control}
        rules={rules}
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        type={type}
        autoComplete={autoComplete}
        sx={styles.formFieldInput}
        InputProps={inputProps}
      />
    </Grid>
  );
}
