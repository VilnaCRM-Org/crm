export type ValidationPswdMessageKey =
  | 'invalidLength'
  | 'numberRequired'
  | 'uppercaseRequired'
  | 'lowercaseRequired'
  | 'fieldRequired';

export type Rule = { check: (value: string) => boolean; key: ValidationPswdMessageKey };
