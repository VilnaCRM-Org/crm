import UIFormInputField from '@/components/ui-form-input-field';
import UITypography from '@/components/ui-typography';
import { Grid } from '@mui/material';
import type { TextFieldProps } from '@mui/material/TextField';
import { InputHTMLAttributes } from 'react';
import { FieldValues, Path, PathValue, RegisterOptions, useFormContext } from 'react-hook-form';

import styles from '@/modules/user/features/auth/components/form-section/components/styles';

type FormFieldInputSlotProps = NonNullable<TextFieldProps['slotProps']>['input'];

export interface FormFieldProps<T extends FieldValues = FieldValues> {
  rules?: RegisterOptions<T, Path<T>>;
  name: Path<T>;
  placeholder: string;
  type: InputHTMLAttributes<HTMLInputElement>['type'];
  label: string;
  autoComplete: string;
  defaultValue?: PathValue<T, Path<T>>;
  inputSlotProps?: FormFieldInputSlotProps;
}

export default function FormField<T extends FieldValues>({
  rules = {} as RegisterOptions<T, Path<T>>,
  defaultValue = '' as unknown as PathValue<T, Path<T>>,
  name,
  placeholder,
  type,
  label,
  autoComplete,
  inputSlotProps,
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
        slotProps={inputSlotProps ? { input: inputSlotProps } : undefined}
        sx={styles.formFieldInput}
      />
    </Grid>
  );
}
