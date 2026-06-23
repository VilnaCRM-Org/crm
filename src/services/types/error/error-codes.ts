import type { ERROR_CODES } from '@/services/error/error-codes';

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
