import type { PasswordRuleEvaluator } from '@/components/types/ui-password-policy-rules';

import type { ChangePasswordRules } from '../hooks/use-profile-form-rules';

export interface ChangePasswordProps {
  readonly rules: ChangePasswordRules;
  readonly evaluate: PasswordRuleEvaluator;
}
