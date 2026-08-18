import { ApiErrorCodes } from '@/modules/user/lib/api-errors';
import type ApiStatusErrorFactory from '@auth/repositories/api-status-error-factory';

type ApiErrorClassName = 'ApiError' | 'AuthenticationError' | 'ConflictError' | 'ValidationError';

type ApiErrorClass = (typeof import('@/modules/user/lib/api-errors'))[ApiErrorClassName];

const CONTEXT = 'Profile';

const SERVICE_UNAVAILABLE_MESSAGE = 'Service unavailable. Please try again later.';

const STATUS_TABLE = [
  {
    status: 400,
    typeName: 'ValidationError',
    code: ApiErrorCodes.VALIDATION,
    message: 'Invalid profile data',
  },
  {
    status: 401,
    typeName: 'AuthenticationError',
    code: ApiErrorCodes.AUTH,
    message: 'Invalid credentials',
  },
  { status: 403, typeName: 'ApiError', code: ApiErrorCodes.FORBIDDEN, message: 'Forbidden' },
  {
    status: 404,
    typeName: 'ApiError',
    code: ApiErrorCodes.NOT_FOUND,
    message: 'Profile not found',
  },
  {
    status: 408,
    typeName: 'ApiError',
    code: ApiErrorCodes.TIMEOUT,
    message: 'Request timed out. Please try again.',
  },
  {
    status: 409,
    typeName: 'ConflictError',
    code: ApiErrorCodes.CONFLICT,
    message: 'Profile conflict. Resource already exists.',
  },
  {
    status: 422,
    typeName: 'ValidationError',
    code: ApiErrorCodes.VALIDATION,
    message: 'Unprocessable profile data',
  },
  {
    status: 429,
    typeName: 'ApiError',
    code: ApiErrorCodes.RATE_LIMITED,
    message: 'Too many requests. Please slow down.',
  },
  {
    status: 500,
    typeName: 'ApiError',
    code: ApiErrorCodes.SERVER,
    message: 'Server error. Please try again later.',
  },
  {
    status: 502,
    typeName: 'ApiError',
    code: ApiErrorCodes.SERVICE_UNAVAILABLE,
    message: SERVICE_UNAVAILABLE_MESSAGE,
  },
  {
    status: 503,
    typeName: 'ApiError',
    code: ApiErrorCodes.SERVICE_UNAVAILABLE,
    message: SERVICE_UNAVAILABLE_MESSAGE,
  },
  {
    status: 504,
    typeName: 'ApiError',
    code: ApiErrorCodes.SERVICE_UNAVAILABLE,
    message: SERVICE_UNAVAILABLE_MESSAGE,
  },
] as const;

const loadFactory = async (): Promise<ApiStatusErrorFactory> => {
  const { default: Factory } = await import('@auth/repositories/api-status-error-factory');

  return new Factory();
};

const loadErrorClass = async (name: ApiErrorClassName): Promise<ApiErrorClass> => {
  const errors = await import('@/modules/user/lib/api-errors');

  return errors[name];
};

describe('ApiStatusErrorFactory status spec table', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it.each(STATUS_TABLE)(
    'maps HTTP $status to a $code error carrying the pinned message',
    async ({ status, typeName, code, message }) => {
      const factory = await loadFactory();
      const httpError = { status, message: `HTTP ${status}` };

      const result = factory.fromHttpError(httpError, CONTEXT);

      expect(result).toBeInstanceOf(await loadErrorClass(typeName));
      expect(result.name).toBe(typeName);
      expect(result.code).toBe(code);
      expect(result.message).toBe(message);
      expect(result.status).toBe(status);
    }
  );

  it('keeps every table entry distinct from the unmapped fallback message', async () => {
    const factory = await loadFactory();

    const messages = STATUS_TABLE.map(
      ({ status }) => factory.fromHttpError({ status, message: 'transport' }, CONTEXT).message
    );

    expect(messages).not.toContain(`${CONTEXT} failed`);
    expect(messages.every((message) => message.length > 0)).toBe(true);
  });

  it('falls back to an unknown ApiError for a status the table does not list', async () => {
    const factory = await loadFactory();
    const httpError = { status: 418, message: 'Teapot' };

    const result = factory.fromHttpError(httpError, CONTEXT);

    expect(result).toBeInstanceOf(await loadErrorClass('ApiError'));
    expect(result.code).toBe(ApiErrorCodes.UNKNOWN);
    expect(result.message).toBe('Profile failed');
    expect(result.status).toBe(418);
    expect(result.cause).toBe(httpError);
  });
});
