export type PasswordRuleKey =
  'invalidLength' | 'numberRequired' | 'uppercaseRequired' | 'lowercaseRequired';

export type ValidationPswdMessageKey = PasswordRuleKey | 'lineBreakForbidden' | 'fieldRequired';

export interface Rule<TKey extends ValidationPswdMessageKey = PasswordRuleKey> {
  check: (value: string) => boolean;
  key: TKey;
}

export interface PasswordRuleResult {
  readonly key: PasswordRuleKey;
  readonly met: boolean;
}

export interface PasswordRuleResultSet {
  readonly items: readonly PasswordRuleResult[];
}
