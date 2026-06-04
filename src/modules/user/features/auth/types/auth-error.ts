export type AuthErrorKind =
  | 'validation'
  | 'authentication'
  | 'conflict'
  | 'server'
  | 'network'
  | 'unknown';

export interface FieldIssue {
  readonly path: string;
  readonly message: string;
}

export interface AuthError {
  readonly kind: AuthErrorKind;
  readonly displayMessage: string;
  readonly retryable: boolean;
  readonly issues?: readonly FieldIssue[];
}

export type AuthResult<T> = { ok: true; value: T } | { ok: false; error: AuthError };

export const isAuthError = (value: unknown): value is AuthError =>
  typeof value === 'object' &&
  value !== null &&
  'kind' in value &&
  'displayMessage' in value &&
  'retryable' in value;
