import type { UserEntity } from '@/modules/user/types/user/user-entity';

import type { ProfileChange } from '../types/user-profile/profile-change';
import type { ProfileFormValues } from '../types/user-profile/profile-form-values';

export default class ProfileChangeDetector {
  public detect(user: UserEntity, values: ProfileFormValues): ProfileChange | null {
    const name = this.nameChanged(user, values.fullName);
    const email = this.emailChanged(user, values.email);
    const password = this.passwordChanged(values.newPassword);
    if (!name && !email && !password) return null;
    return {
      id: user.id,
      currentPassword: values.currentPassword,
      ...(name ? { fullName: values.fullName.trim() } : {}),
      ...(email ? { email: values.email.trim() } : {}),
      ...(password ? { newPassword: values.newPassword } : {}),
    };
  }

  public nameChanged(user: UserEntity, fullName: string): boolean {
    return fullName.trim() !== user.fullName.trim();
  }

  public passwordChanged(newPassword: string): boolean {
    return newPassword.trim() !== '';
  }

  public emailChanged(user: UserEntity, email: string): boolean {
    return email.trim().toLowerCase() !== user.email.trim().toLowerCase();
  }
}
