import type { PasswordChange } from './password-change';

export interface ProfileFormValues extends PasswordChange {
  readonly fullName: string;
  readonly email: string;
}
