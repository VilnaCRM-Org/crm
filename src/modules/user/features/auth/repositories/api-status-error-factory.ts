import { injectable } from 'tsyringe';

import {
  ApiError,
  ApiErrorCodes,
  AuthenticationError,
  ConflictError,
  ValidationError,
} from '@/modules/user/types/api-errors';

export interface HttpErrorLike {
  status: number;
  message: string;
}

type StatusErrorSpec =
  | { kind: 'validation'; status: 400 | 422; prefix: 'Invalid' | 'Unprocessable' }
  | { kind: 'auth' }
  | { kind: 'api'; status: number; code: string; message: string }
  | { kind: 'conflict' }
  | { kind: 'service' };

const STATUS_ERROR_SPECS: Record<number, StatusErrorSpec> = {
  400: { kind: 'validation', prefix: 'Invalid', status: 400 },
  401: { kind: 'auth' },
  403: { kind: 'api', code: ApiErrorCodes.FORBIDDEN, message: 'Forbidden', status: 403 },
  404: { kind: 'api', code: ApiErrorCodes.NOT_FOUND, message: 'not found', status: 404 },
  408: {
    kind: 'api',
    code: ApiErrorCodes.TIMEOUT,
    message: 'Request timed out. Please try again.',
    status: 408,
  },
  409: { kind: 'conflict' },
  422: { kind: 'validation', prefix: 'Unprocessable', status: 422 },
  429: {
    kind: 'api',
    code: ApiErrorCodes.RATE_LIMITED,
    message: 'Too many requests. Please slow down.',
    status: 429,
  },
  500: {
    kind: 'api',
    code: ApiErrorCodes.SERVER,
    message: 'Server error. Please try again later.',
    status: 500,
  },
  502: { kind: 'service' },
  503: { kind: 'service' },
  504: { kind: 'service' },
};

type StatusErrorInput = { error: HttpErrorLike; context: string };

@injectable()
export default class ApiStatusErrorFactory {
  public fromHttpError(error: HttpErrorLike, context: string): ApiError {
    const spec = STATUS_ERROR_SPECS[error.status];
    if (!spec) {
      return new ApiError({
        message: `${context} failed`,
        code: ApiErrorCodes.UNKNOWN,
        status: error.status,
        cause: error,
      });
    }
    return this.toApiError(spec, { error, context });
  }

  private toApiError(spec: StatusErrorSpec, input: StatusErrorInput): ApiError {
    if (spec.kind === 'validation') return this.toValidationError(spec, input);
    if (spec.kind === 'api') return this.toKnownApiError(spec, input);
    return this.toSimpleApiError(spec.kind, input);
  }

  private toSimpleApiError(
    kind: 'auth' | 'conflict' | 'service',
    input: StatusErrorInput
  ): ApiError {
    if (kind === 'auth') return new AuthenticationError();
    if (kind === 'conflict')
      return new ConflictError(`${input.context} conflict. Resource already exists.`);
    return this.toServiceUnavailableError(input.error);
  }

  private toKnownApiError(
    spec: Extract<StatusErrorSpec, { kind: 'api' }>,
    input: StatusErrorInput
  ): ApiError {
    const message = spec.status === 404 ? `${input.context} ${spec.message}` : spec.message;
    return new ApiError({
      message,
      code: spec.code,
      status: spec.status,
      cause: input.error,
    });
  }

  private toServiceUnavailableError(error: HttpErrorLike): ApiError {
    return new ApiError({
      message: 'Service unavailable. Please try again later.',
      code: ApiErrorCodes.SERVICE_UNAVAILABLE,
      status: error.status,
      cause: error,
    });
  }

  private toValidationError(
    spec: Extract<StatusErrorSpec, { kind: 'validation' }>,
    input: StatusErrorInput
  ): ValidationError {
    return new ValidationError({
      message: `${spec.prefix} ${input.context.toLowerCase()} data`,
      status: spec.status,
      cause: input.error,
    });
  }
}
