export interface PasswordPolicyRulesProps {
  id: string;
  name: string;
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
