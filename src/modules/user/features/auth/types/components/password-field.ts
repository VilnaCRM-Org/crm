import type { TFunction } from 'i18next';

export interface PasswordFieldProps {
  placeholder: string;
  label: string;
  autoComplete: string;
}

export interface PasswordVisibilityButtonProps {
  show: boolean;
  onToggle: () => void;
  t: TFunction;
}
