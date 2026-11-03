import type { Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';
import type { TFunction } from 'i18next';
import type { FieldValues, Path, PathValue, RegisterOptions } from 'react-hook-form';

export type PasswordPath<T extends FieldValues> = Extract<
  { [K in Path<T>]: PathValue<T, K> extends string ? K : never }[Path<T>],
  Path<T>
>;

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
  name?: PasswordPath<T> | undefined;
}

export interface PasswordFieldNamedProps<T extends FieldValues> extends PasswordFieldBaseProps<T> {
  name: PasswordPath<T>;
}

export type PasswordFieldProps<T extends FieldValues = FieldValues> =
  'password' extends PasswordPath<T>
    ? PasswordFieldDefaultNameProps<T>
    : PasswordFieldNamedProps<T>;

export interface PasswordVisibilityButtonProps {
  show: boolean;
  onToggle: () => void;
  t: TFunction;
}
