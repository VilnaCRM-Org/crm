import type { ERROR_CODES } from './error-codes';

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
