export interface HttpErrorLike {
  status: number;
  message: string;
}

export type StatusErrorSpec =
  | { kind: 'validation'; status: 400 | 422; prefix: 'Invalid' | 'Unprocessable' }
  | { kind: 'auth' }
  | { kind: 'api'; status: number; code: string; message: string }
  | { kind: 'conflict' }
  | { kind: 'service' };
