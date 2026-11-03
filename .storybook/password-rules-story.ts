import type { PasswordRuleViewSet } from '@/components/types/ui-password-policy-rules';
import passwordValidator from '@/modules/user/lib/validations/password';

export function evaluateStoryPassword(value: string): PasswordRuleViewSet {
  return passwordValidator.evaluate(value);
}
