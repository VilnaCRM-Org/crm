import { inject, injectable } from 'tsyringe';

import TOKENS from '@/config/tokens';
import { ApiError, ApiErrorCodes } from '@/modules/user/lib/api-errors';
import HttpErrorGuard from '@/services/https-client/http-error-guard';

import ApiStatusErrorFactory from './api-status-error-factory';
import type { HttpErrorLike } from './api-status-error-factory.types';

const NETWORK_KEYWORDS = [
  'failed to fetch',
  'network',
  'connection',
  'timeout',
  'cors',
  'econnreset',
  'enotfound',
  'econnrefused',
  'enetunreach',
  'ehostunreach',
  'err_network',
];

const CANCELLATION_KEYWORDS = ['abort', 'aborted', 'ecanceled', 'canceled', 'cancelled'];

@injectable()
export default class ApiErrorFactory {
  constructor(
    @inject(TOKENS.ApiStatusErrorFactory)
    private readonly statusErrorFactory: ApiStatusErrorFactory,
    @inject(TOKENS.HttpErrorGuard) private readonly httpErrorGuard: HttpErrorGuard
  ) {}

  public convert(error: unknown, context: string): ApiError {
    if (this.httpErrorGuard.is(error)) return this.fromHttpError(error, context);
    if (error instanceof Error) return this.fromGenericError(error, context);
    return this.fromUnknownError(context);
  }

  private fromHttpError(error: HttpErrorLike, context: string): ApiError {
    if (this.isCancellationMessage(error.message)) {
      return this.cancelledError(error);
    }

    if (error.status === 0 || (!error.status && this.isNetworkMessage(error.message))) {
      return this.networkError(error);
    }

    return this.statusErrorFactory.fromHttpError(error, context);
  }

  private fromGenericError(error: Error, context: string): ApiError {
    if (this.isAbortError(error)) return this.cancelledError(error);
    if (this.isNetworkMessage(error.message)) return this.networkError(error);
    return new ApiError({
      message: `${context} failed. Please try again.`,
      code: ApiErrorCodes.UNKNOWN,
      cause: error,
    });
  }

  private fromUnknownError(context: string): ApiError {
    return new ApiError({
      message: `${context} failed. Please try again.`,
      code: ApiErrorCodes.UNKNOWN,
    });
  }

  private isAbortError(err: Error): boolean {
    const name = err.name?.toLowerCase?.() ?? '';
    return name === 'aborterror' || this.isCancellationMessage(err.message);
  }

  private isCancellationMessage(message: string): boolean {
    if (!message) return false;
    const normalized = message.toLowerCase();
    return CANCELLATION_KEYWORDS.some((keyword) => normalized.includes(keyword));
  }

  private isNetworkMessage(message: string): boolean {
    if (!message) return false;
    const normalized = message.toLowerCase();
    return NETWORK_KEYWORDS.some((keyword) => normalized.includes(keyword));
  }

  private networkError(error: unknown): ApiError {
    return new ApiError({
      message: 'Network error. Please check your connection.',
      code: ApiErrorCodes.NETWORK,
      cause: error,
    });
  }

  private cancelledError(error: unknown): ApiError {
    return new ApiError({
      message: 'Request canceled.',
      code: ApiErrorCodes.CANCELLED,
      cause: error,
    });
  }
}
