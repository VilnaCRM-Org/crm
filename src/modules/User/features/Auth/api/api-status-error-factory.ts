import {
  ApiError,
  ApiErrorCodes,
  AuthenticationError,
  ConflictError,
  ValidationError,
} from './ApiErrors';

export type HttpErrorLike = { status: number; message: string };

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

export default class ApiStatusErrorFactory {
  private readonly context: string;

  private readonly error: HttpErrorLike;

  private readonly spec: StatusErrorSpec;

  private constructor(spec: StatusErrorSpec, error: HttpErrorLike, context: string) {
    this.spec = spec;
    this.error = error;
    this.context = context;
  }

  public static fromHttpError(error: HttpErrorLike, context: string): ApiError {
    const spec = STATUS_ERROR_SPECS[error.status];
    if (!spec)
      return new ApiError({
        message: `${context} failed`,
        code: ApiErrorCodes.UNKNOWN,
        status: error.status,
        cause: error,
      });
    return new ApiStatusErrorFactory(spec, error, context).toApiError();
  }

  private toApiError(): ApiError {
    let result = this.toServiceUnavailableError();
    if (this.spec.kind === 'validation') result = this.toValidationError(this.spec);
    else if (this.spec.kind === 'auth') result = new AuthenticationError();
    else if (this.spec.kind === 'api') result = this.toKnownApiError(this.spec);
    else if (this.spec.kind === 'conflict')
      result = new ConflictError(`${this.context} conflict. Resource already exists.`);
    return result;
  }

  private toKnownApiError(spec: Extract<StatusErrorSpec, { kind: 'api' }>): ApiError {
    const message = spec.status === 404 ? `${this.context} ${spec.message}` : spec.message;
    return new ApiError({
      message,
      code: spec.code,
      status: spec.status,
      cause: this.error,
    });
  }

  private toServiceUnavailableError(): ApiError {
    return new ApiError({
      message: 'Service unavailable. Please try again later.',
      code: ApiErrorCodes.SERVER,
      status: this.error.status,
      cause: this.error,
    });
  }

  private toValidationError(
    spec: Extract<StatusErrorSpec, { kind: 'validation' }>
  ): ValidationError {
    return new ValidationError({
      message: `${spec.prefix} ${this.context.toLowerCase()} data`,
      status: spec.status,
    });
  }
}
