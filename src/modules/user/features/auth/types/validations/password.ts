export type ValidationPswdMessageKey =
  'invalidLength' | 'numberRequired' | 'uppercaseRequired' | 'lowercaseRequired' | 'fieldRequired';

export interface Rule {
  check: (value: string) => boolean;
  key: ValidationPswdMessageKey;
}

export interface PasswordRuleResult {
  readonly key: ValidationPswdMessageKey;
  readonly met: boolean;
}

export interface PasswordRuleResultSet {
  readonly items: readonly PasswordRuleResult[];
}
