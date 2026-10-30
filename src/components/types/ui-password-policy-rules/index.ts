export type PasswordRuleViewKey =
  'invalidLength' | 'numberRequired' | 'uppercaseRequired' | 'lowercaseRequired';

export interface PasswordRuleView {
  readonly key: PasswordRuleViewKey;
  readonly met: boolean;
}

export interface PasswordRuleViewSet {
  readonly items: readonly PasswordRuleView[];
}

export type PasswordRuleEvaluator = (value: string) => PasswordRuleViewSet;

export interface UIPasswordPolicyRulesProps {
  id: string;
  name: string;
  evaluate: PasswordRuleEvaluator;
}

export interface PasswordRuleItemProps {
  label: string;
  met: boolean;
}

export interface PasswordRuleLabels {
  invalidLength: string;
  numberRequired: string;
  uppercaseRequired: string;
  lowercaseRequired: string;
}
