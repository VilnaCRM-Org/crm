import UIFormTextField from '@/components/UIFormTextField';
import UITypography from '@/components/UITypography';
import { Grid } from '@mui/material';
import type { InputProps } from '@mui/material/Input';
import { InputHTMLAttributes } from 'react';
import { Control, FieldValues, Path, PathValue, RegisterOptions } from 'react-hook-form';

import Styles from '@/modules/User/features/Auth/components/FormSection/Form/styles';

export interface FormFieldProps<T extends FieldValues = FieldValues> {
  control: Control<T>;
  rules: RegisterOptions<T, Path<T>>;
  defaultValue: PathValue<T, Path<T>>;
  name: Path<T>;
  placeholder: string;
  type: InputHTMLAttributes<HTMLInputElement>['type'];
  label: string;
  autoComplete: string;
  // eslint-disable-next-line react/require-default-props
  inputProps?: InputProps;
}

export default function FormField<T extends FieldValues>({
  control,
  rules,
  defaultValue,
  name,
  placeholder,
  type,
  label,
  autoComplete,
  inputProps = {},
}: FormFieldProps<T>): JSX.Element {
  return (
    <Grid container flexDirection="column" sx={Styles.formFieldWrapper}>
      <UITypography sx={Styles.formFieldLabel}>{label}</UITypography>
      <UIFormTextField
        control={control}
        rules={rules}
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        type={type}
        autoComplete={autoComplete}
        sx={Styles.formFieldInput}
        InputProps={inputProps}
      />
    </Grid>
  );
}
