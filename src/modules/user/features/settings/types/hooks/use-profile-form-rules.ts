import type { RegisterOptions } from 'react-hook-form';

import type { PasswordRuleEvaluator } from '@/components/types/ui-password-policy-rules';

import type { ProfileFormValues } from '../user-profile/profile-form-values';

export type ProfileFieldRules = RegisterOptions<ProfileFormValues>;

export interface ChangePasswordRules {
  readonly currentPassword: ProfileFieldRules;
  readonly newPassword: ProfileFieldRules;
}

export interface ProfileFormRules extends ChangePasswordRules {
  readonly fullName: ProfileFieldRules;
  readonly email: ProfileFieldRules;
  readonly evaluate: PasswordRuleEvaluator;
}
