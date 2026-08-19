import { ERROR_CODES } from '@/services/error/error-codes';
import type { ErrorCode } from '@/services/types/error/error-codes';

/**
 * The user-facing copy and retryability of each error code are a product contract, so these are
 * pinned literals rather than Faker data (CLAUDE.md pattern 8).
 */
const ERROR_MAP: ReadonlyArray<readonly [ErrorCode, string, boolean]> = [
  [ERROR_CODES.AUTH_INVALID, 'Invalid credentials', false],
  [ERROR_CODES.HTTP_401, 'Unauthorized', false],
  [ERROR_CODES.HTTP_500, 'Internal server error', false],
  [ERROR_CODES.JS_ERROR, 'JavaScript error occurred', false],
  [ERROR_CODES.UNKNOWN_ERROR, 'An unknown error occurred', false],
  [ERROR_CODES.AUTHENTICATION_ERROR, 'Invalid credentials', false],
  [ERROR_CODES.VALIDATION_ERROR, 'Invalid data provided', false],
  [ERROR_CODES.CONFLICT_ERROR, 'Resource already exists', false],
  [ERROR_CODES.SERVER_ERROR, 'Internal server error', true],
  [ERROR_CODES.SERVICE_UNAVAILABLE_ERROR, 'Service unavailable. Please try again later.', true],
  [ERROR_CODES.NETWORK_ERROR, 'Network error. Please check your connection.', true],
  [ERROR_CODES.FORBIDDEN, 'Access forbidden', false],
  [ERROR_CODES.NOT_FOUND, 'Resource not found', false],
  [ERROR_CODES.TIMEOUT, 'Request timed out', true],
  [ERROR_CODES.RATE_LIMITED, 'Too many requests. Please slow down.', true],
  [ERROR_CODES.CANCELLED, 'Request was cancelled', false],
];

const loadHandler = async (): Promise<{ handleAuthError: (code: string) => unknown }> => {
  const { ErrorHandler } = await import('@/services/error/error-handler');
  const handler = new ErrorHandler();
  return { handleAuthError: (code: string) => handler.handleAuthError({ code, message: code }) };
};

describe('ErrorHandler error map', () => {
  /**
   * The map is a module-level literal, so it is evaluated on import. Loading the module inside the
   * test is what puts those values under an assertion instead of leaving them evaluated before any
   * test starts.
   */
  beforeEach(() => {
    jest.resetModules();
  });

  it.each(ERROR_MAP)(
    'presents %s as its own message and retryability',
    async (code, message, retryable) => {
      const { handleAuthError } = await loadHandler();

      expect(handleAuthError(code)).toEqual({ displayMessage: message, retryable });
    }
  );

  it('falls back to a generic retryless message for an unmapped code', async () => {
    const { handleAuthError } = await loadHandler();

    expect(handleAuthError('NOT_A_MAPPED_CODE')).toEqual({
      displayMessage: 'Something went wrong. Please try again.',
      retryable: false,
    });
  });

  it('marks exactly the transient failures retryable', async () => {
    const { handleAuthError } = await loadHandler();
    const retryable = ERROR_MAP.filter(
      ([code]) => (handleAuthError(code) as { retryable: boolean }).retryable
    ).map(([code]) => code);

    expect(retryable).toEqual([
      ERROR_CODES.SERVER_ERROR,
      ERROR_CODES.SERVICE_UNAVAILABLE_ERROR,
      ERROR_CODES.NETWORK_ERROR,
      ERROR_CODES.TIMEOUT,
      ERROR_CODES.RATE_LIMITED,
    ]);
  });

  it('never hands back an empty message for a mapped code', async () => {
    const { handleAuthError } = await loadHandler();

    ERROR_MAP.forEach(([code]) => {
      expect((handleAuthError(code) as { displayMessage: string }).displayMessage).not.toBe('');
    });
  });
});
