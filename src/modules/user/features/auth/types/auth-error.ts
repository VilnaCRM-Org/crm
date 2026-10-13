export type AuthErrorKind =
  'validation' | 'authentication' | 'conflict' | 'server' | 'network' | 'unknown';

export interface FieldIssue {
  readonly path: string;
  readonly message: string;
}

export interface AuthError {
  readonly kind: AuthErrorKind;
  readonly displayMessage: string;
  readonly retryable: boolean;
  readonly status?: number;
  readonly issues?: readonly FieldIssue[];
  readonly aborted?: boolean;
}

export interface AuthOkResult<T> {
  readonly ok: true;
  readonly value: T;
}

export interface AuthFailedResult {
  readonly ok: false;
  readonly error: AuthError;
}

export type AuthResult<T> = AuthOkResult<T> | AuthFailedResult;
