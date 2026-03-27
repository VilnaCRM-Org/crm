import UIFormInputField from '@/components/UIFormInputField';
import UITypography from '@/components/UITypography';
import { Grid } from '@mui/material';
import type { InputProps } from '@mui/material/Input';
import { InputHTMLAttributes } from 'react';
import { FieldValues, Path, PathValue, RegisterOptions, useFormContext } from 'react-hook-form';

import styles from './styles';

export interface FormFieldProps<T extends FieldValues = FieldValues> {
  rules: RegisterOptions<T, Path<T>>;
  name: Path<T>;
  placeholder: string;
  type: InputHTMLAttributes<HTMLInputElement>['type'];
  label: string;
  autoComplete: string;
  // eslint-disable-next-line react/require-default-props
  defaultValue?: PathValue<T, Path<T>>;
  // eslint-disable-next-line react/require-default-props
  inputProps?: InputProps;
}

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
