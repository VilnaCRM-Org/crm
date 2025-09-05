export const ERROR_CODES = {
  AUTH_INVALID: 'AUTH_INVALID',
  HTTP_401: 'HTTP_401',
  HTTP_500: 'HTTP_500',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
