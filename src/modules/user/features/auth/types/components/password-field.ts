import type { TFunction } from 'i18next';
import type { FieldValues, Path, RegisterOptions } from 'react-hook-form';

export interface PasswordFieldProps<T extends FieldValues = FieldValues> {
  placeholder: string;
  label: string;
  autoComplete: string;
  name?: Path<T> | undefined;
  rules?: RegisterOptions<T, Path<T>> | undefined;
  describedBy?: string | undefined;
}

export interface PasswordVisibilityButtonProps {
  show: boolean;
  onToggle: () => void;
  t: TFunction;
}
