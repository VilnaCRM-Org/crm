import type { PasswordRuleEvaluator } from '@/components/types/ui-password-policy-rules';

import type { ChangePasswordRules } from '../hooks/use-profile-form-rules';

export interface CurrentPasswordProps {
  readonly rules: ChangePasswordRules;
  readonly busy: boolean;
}

export interface ChangePasswordProps extends CurrentPasswordProps {
  readonly evaluate: PasswordRuleEvaluator;
}
