import type { RegisterOptions } from 'react-hook-form';

import type { PasswordRuleEvaluator } from '@/components/types/ui-password-policy-rules';
import type { UserEntity } from '@/modules/user/types/user/user-entity';

import type ProfileChangeDetector from '../../utils/profile-change-detector';
import type { ProfileFormValues } from '../user-profile/profile-form-values';

export type ProfileFieldRules = RegisterOptions<ProfileFormValues>;

export interface SectionPasswordRuleContext {
  readonly user: UserEntity;
  readonly changes: ProfileChangeDetector;
}

export interface ChangePasswordRules {
  readonly currentPassword: ProfileFieldRules;
  readonly newPassword: ProfileFieldRules;
}

export interface ProfileFormRules extends ChangePasswordRules {
  readonly fullName: ProfileFieldRules;
  readonly email: ProfileFieldRules;
  readonly fullNamePassword: ProfileFieldRules;
  readonly emailPassword: ProfileFieldRules;
  readonly evaluate: PasswordRuleEvaluator;
}
