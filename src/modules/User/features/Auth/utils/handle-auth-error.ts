import { ErrorHandler, type UiError } from '@/services/error';
import { ErrorParser } from '@/utils/error';

export type { UiError };

export const handleAuthError = (error: unknown): UiError =>
  ErrorHandler.handleAuthError(ErrorParser.parseHttpError(error));
