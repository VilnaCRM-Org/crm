export const ApiErrorCodes = {
  VALIDATION: 'VALIDATION_ERROR',
  AUTH: 'AUTHENTICATION_ERROR',
  CONFLICT: 'CONFLICT_ERROR',
  SERVER: 'SERVER_ERROR',
  NETWORK: 'NETWORK_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
} as const;

export type ApiErrorCode = (typeof ApiErrorCodes)[keyof typeof ApiErrorCodes];
