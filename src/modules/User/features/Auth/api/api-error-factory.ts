import {
  ApiError,
  ApiErrorCodes,
  AuthenticationError,
  ConflictError,
  ValidationError,
} from './ApiErrors';

type HttpErrorLike = { status: number; message: string };
type StatusErrorSpec =
  | { kind: 'validation'; status: 400 | 422; prefix: 'Invalid' | 'Unprocessable' }
  | { kind: 'auth' }
  | { kind: 'api'; status: number; code: string; message: string }
  | { kind: 'conflict' }
  | { kind: 'service' };
type ApiStatusErrorSpec = Extract<StatusErrorSpec, { kind: 'api' }>;

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
  'ecanceled',
  'canceled',
  'cancelled',
  'err_network',
];

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

function networkError(error: unknown): ApiError {
  return new ApiError(
    'Network error. Please check your connection.',
    ApiErrorCodes.NETWORK,
    undefined,
    error
  );
}

function serviceUnavailable(err: HttpErrorLike): ApiError {
  return new ApiError(
    'Service unavailable. Please try again later.',
    ApiErrorCodes.SERVER,
    err.status,
    err
  );
}

function getApiMessage(spec: ApiStatusErrorSpec, context: string): string {
  return spec.status === 404 ? `${context} ${spec.message}` : spec.message;
}

/* eslint-disable no-nested-ternary */
function fromSpec(spec: StatusErrorSpec, error: HttpErrorLike, context: string): ApiError {
  return spec.kind === 'validation'
    ? new ValidationError({
        message: `${spec.prefix} ${context.toLowerCase()} data`,
        status: spec.status,
      })
    : spec.kind === 'auth'
      ? new AuthenticationError()
      : spec.kind === 'api'
        ? new ApiError(getApiMessage(spec, context), spec.code, spec.status, error)
        : spec.kind === 'conflict'
          ? new ConflictError(`${context} conflict. Resource already exists.`)
          : serviceUnavailable(error);
}
/* eslint-enable no-nested-ternary */

function fromStatusError(error: HttpErrorLike, context: string): ApiError {
  const spec = STATUS_ERROR_SPECS[error.status];
  return spec
    ? fromSpec(spec, error, context)
    : new ApiError(`${context} failed`, ApiErrorCodes.UNKNOWN, error.status, error);
}

function isAbortError(err: Error): boolean {
  const name = err.name?.toLowerCase?.() ?? '';
  const msg = err.message?.toLowerCase?.() ?? '';
  return name === 'aborterror' || msg.includes('abort');
}

function isNetworkMessage(message: string): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  for (const keyword of NETWORK_KEYWORDS) {
    if (normalized.includes(keyword)) return true;
  }
  return false;
}

export function fromHttpError(error: HttpErrorLike, context: string): ApiError {
  if (error.status === 0 || isNetworkMessage(error.message)) return networkError(error);
  return fromStatusError(error, context);
}

export function fromGenericError(error: Error, context: string): ApiError {
  if (isAbortError(error))
    return new ApiError('Request canceled.', ApiErrorCodes.CANCELLED, undefined, error);
  if (isNetworkMessage(error.message)) return networkError(error);
  return new ApiError(`${context} failed. Please try again.`, ApiErrorCodes.UNKNOWN);
}

export function fromUnknownError(context: string): ApiError {
  return new ApiError(`${context} failed. Please try again.`, ApiErrorCodes.UNKNOWN);
}
