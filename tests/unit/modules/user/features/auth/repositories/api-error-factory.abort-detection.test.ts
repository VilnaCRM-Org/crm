import { ApiErrorCodes } from '@/modules/user/lib/api-errors';
import { HttpError } from '@/services/https-client/http-error';
import HttpErrorGuard from '@/services/https-client/http-error-guard';
import ApiErrorFactory from '@auth/repositories/api-error-factory';
import ApiStatusErrorFactory from '@auth/repositories/api-status-error-factory';

const NEUTRAL_MESSAGE = 'Something unexpected happened';

const makeFactory = (): ApiErrorFactory =>
  new ApiErrorFactory(new ApiStatusErrorFactory(), new HttpErrorGuard());

describe('ApiErrorFactory — zero status and abort detection', () => {
  it('maps a zero-status HTTP failure to a network error whatever its message says', () => {
    const httpError = new HttpError({ status: 0, message: NEUTRAL_MESSAGE });

    const apiError = makeFactory().convert(httpError, 'Login');

    expect(apiError.code).toBe(ApiErrorCodes.NETWORK);
    expect(apiError.message).toBe('Network error. Please check your connection.');
    expect(apiError.cause).toBe(httpError);
  });

  it.each(['AbortError', 'ABORTERROR', 'aborterror'])(
    'maps the %s error name to the cancelled code without cancellation wording',
    (name) => {
      const error = Object.assign(new Error(NEUTRAL_MESSAGE), { name });

      const apiError = makeFactory().convert(error, 'Login');

      expect(apiError.code).toBe(ApiErrorCodes.CANCELLED);
      expect(apiError.message).toBe('Request canceled.');
      expect(apiError.cause).toBe(error);
    }
  );

  it('does not treat a blank error name as a cancellation', () => {
    const error = Object.assign(new Error(NEUTRAL_MESSAGE), { name: '' });

    const apiError = makeFactory().convert(error, 'Login');

    expect(apiError.code).toBe(ApiErrorCodes.UNKNOWN);
    expect(apiError.message).toBe('Login failed. Please try again.');
  });

  it('tolerates an error whose name is not a string', () => {
    const error = new Error(NEUTRAL_MESSAGE);
    Object.defineProperty(error, 'name', { value: 42, configurable: true, writable: true });

    const apiError = makeFactory().convert(error, 'Login');

    expect(apiError.code).toBe(ApiErrorCodes.UNKNOWN);
    expect(apiError.message).toBe('Login failed. Please try again.');
  });
});
