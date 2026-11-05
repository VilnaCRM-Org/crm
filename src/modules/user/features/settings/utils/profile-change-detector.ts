import type { UserEntity } from '@/modules/user/types/user/user-entity';

import type { ProfileChange } from '../types/user-profile/profile-change';
import type { ProfileFormValues } from '../types/user-profile/profile-form-values';
import type { ProfileSection } from '../types/user-profile/profile-section';

export default class ProfileChangeDetector {
  public detect(
    section: ProfileSection,
    user: UserEntity,
    values: ProfileFormValues
  ): ProfileChange | null {
    return this.sectionChanged(section, user, values) ? this.build(section, user, values) : null;
  }

  public sectionChanged(
    section: ProfileSection,
    user: UserEntity,
    values: ProfileFormValues
  ): boolean {
    if (section === 'fullName') return this.nameChanged(user, values.fullName);
    if (section === 'email') return this.emailChanged(user, values.email);
    return this.passwordChanged(values.newPassword);
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

  private build(
    section: ProfileSection,
    user: UserEntity,
    values: ProfileFormValues
  ): ProfileChange {
    if (section === 'fullName') {
      return {
        id: user.id,
        currentPassword: values.fullNamePassword,
        fullName: values.fullName.trim(),
      };
    }
    if (section === 'email') {
      return { id: user.id, currentPassword: values.emailPassword, email: values.email.trim() };
    }
    return {
      id: user.id,
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    };
  }
}
