export interface HttpErrorLike {
  status: number;
  message: string;
}

export interface ValidationStatusErrorSpec {
  kind: 'validation';
  status: 400 | 422;
  prefix: 'Invalid' | 'Unprocessable';
}

export interface AuthStatusErrorSpec {
  kind: 'auth';
}

export interface ApiStatusErrorSpec {
  kind: 'api';
  status: number;
  code: string;
  message: string;
}

export interface ConflictStatusErrorSpec {
  kind: 'conflict';
}

export interface ServiceStatusErrorSpec {
  kind: 'service';
}

export type StatusErrorSpec =
  | ValidationStatusErrorSpec
  | AuthStatusErrorSpec
  | ApiStatusErrorSpec
  | ConflictStatusErrorSpec
  | ServiceStatusErrorSpec;

export interface StatusErrorInput {
  error: HttpErrorLike;
  context: string;
}
