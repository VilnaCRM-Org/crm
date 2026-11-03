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
  readonly id: string;
  readonly name: string;
  readonly evaluate: PasswordRuleEvaluator;
}

export interface PasswordRuleItemProps {
  label: string;
  met: boolean;
}

export interface PasswordRuleLabels {
  readonly invalidLength: string;
  readonly numberRequired: string;
  readonly uppercaseRequired: string;
  readonly lowercaseRequired: string;
}
