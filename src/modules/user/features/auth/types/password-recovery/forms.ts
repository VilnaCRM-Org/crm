import type { CreateNewPasswordDto } from '@/modules/user/types/user/create-new-password-dto';

export interface CreateNewPasswordFormValues extends CreateNewPasswordDto {
  readonly confirmPassword: string;
}
