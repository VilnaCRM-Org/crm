export type ValidationPswdMessageKey =
  'invalidLength' | 'numberRequired' | 'uppercaseRequired' | 'lowercaseRequired' | 'fieldRequired';

export interface Rule {
  check: (value: string) => boolean;
  key: ValidationPswdMessageKey;
}
