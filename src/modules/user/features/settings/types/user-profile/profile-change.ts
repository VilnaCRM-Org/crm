export interface ProfileChange {
  readonly id: string;
  readonly currentPassword: string;
  readonly fullName?: string | undefined;
  readonly email?: string | undefined;
  readonly newPassword?: string | undefined;
}
