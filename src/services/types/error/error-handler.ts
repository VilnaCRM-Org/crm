export type ErrorLogger = Pick<Console, 'error'>;

export interface UiError {
  readonly displayMessage: string;
  readonly retryable: boolean;
}
