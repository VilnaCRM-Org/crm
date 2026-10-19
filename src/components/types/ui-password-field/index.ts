import type { Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';
import type { TFunction } from 'i18next';
import type { FieldValues, Path, RegisterOptions } from 'react-hook-form';

interface PasswordFieldBaseProps<T extends FieldValues> {
  placeholder: string;
  label: string;
  autoComplete: string;
  rules: RegisterOptions<T, Path<T>>;
  describedBy?: string | undefined;
  readOnly?: boolean | undefined;
  sx?: SystemStyleObject<Theme> | undefined;
}

export interface PasswordFieldDefaultNameProps<
  T extends FieldValues,
> extends PasswordFieldBaseProps<T> {
  name?: Path<T> | undefined;
}

export interface PasswordFieldNamedProps<T extends FieldValues> extends PasswordFieldBaseProps<T> {
  name: Path<T>;
}

export type PasswordFieldProps<T extends FieldValues = FieldValues> =
  'password' extends Path<T> ? PasswordFieldDefaultNameProps<T> : PasswordFieldNamedProps<T>;

export interface PasswordVisibilityButtonProps {
  show: boolean;
  onToggle: () => void;
  t: TFunction;
}
