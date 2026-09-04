import { ApiErrorCodes } from '@/modules/user/lib/api-errors';
import type { HttpError } from '@/services/https-client/http-error';
import type ApiErrorFactory from '@auth/repositories/api-error-factory';

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
] as const;

const CANCELLATION_KEYWORDS = ['abort', 'aborted', 'ecanceled', 'canceled', 'cancelled'] as const;

const UNMATCHED_MESSAGES = [
  'unexpected failure',
  'server rejected the payload',
  'upstream returned an unexpected shape',
] as const;

const loadFactory = async (): Promise<ApiErrorFactory> => {
  const [{ default: Factory }, { default: StatusFactory }, { default: Guard }] = await Promise.all([
    import('@auth/repositories/api-error-factory'),
    import('@auth/repositories/api-status-error-factory'),
    import('@/services/https-client/http-error-guard'),
  ]);

  return new Factory(new StatusFactory(), new Guard());
};

const loadStatuslessHttpError = async (message: string): Promise<HttpError> => {
  const { HttpError: FreshHttpError } = await import('@/services/https-client/http-error');

  return new FreshHttpError({ status: undefined as unknown as number, message });
};

describe('ApiErrorFactory keyword tables', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it.each(NETWORK_KEYWORDS)(
    'classifies a transport message containing "%s" as a network failure',
    async (keyword) => {
      const factory = await loadFactory();

      const apiError = factory.convert(new Error(`Request failed: ${keyword}`), 'Login');

      expect(apiError.code).toBe(ApiErrorCodes.NETWORK);
      expect(apiError.message).toBe('Network error. Please check your connection.');
    }
  );

  it.each(CANCELLATION_KEYWORDS)(
    'classifies a transport message containing "%s" as a cancellation',
    async (keyword) => {
      const factory = await loadFactory();

      const apiError = factory.convert(new Error(`Request ${keyword} by the caller`), 'Login');

      expect(apiError.code).toBe(ApiErrorCodes.CANCELLED);
      expect(apiError.message).toBe('Request canceled.');
    }
  );

  it.each(UNMATCHED_MESSAGES)(
    'leaves the generic error "%s" unknown because it matches neither table',
    async (message) => {
      const factory = await loadFactory();

      const apiError = factory.convert(new Error(message), 'Login');

      expect(apiError.code).toBe(ApiErrorCodes.UNKNOWN);
      expect(apiError.message).toBe('Login failed. Please try again.');
    }
  );

  it.each(UNMATCHED_MESSAGES)(
    'routes the statusless HTTP failure "%s" to the status table, not the keyword tables',
    async (message) => {
      const factory = await loadFactory();
      const httpError = await loadStatuslessHttpError(message);

      const apiError = factory.convert(httpError, 'Login');

      expect(apiError.code).toBe(ApiErrorCodes.UNKNOWN);
      expect(apiError.message).toBe('Login failed');
    }
  );

  it('keeps an empty transport message out of both keyword tables', async () => {
    const factory = await loadFactory();

    const apiError = factory.convert(new Error(''), 'Login');

    expect(apiError.code).toBe(ApiErrorCodes.UNKNOWN);
    expect(apiError.message).toBe('Login failed. Please try again.');
  });

  it('prefers cancellation over network when a message carries both signals', async () => {
    const factory = await loadFactory();

    const apiError = factory.convert(new Error('network request aborted'), 'Login');

    expect(apiError.code).toBe(ApiErrorCodes.CANCELLED);
  });
});
