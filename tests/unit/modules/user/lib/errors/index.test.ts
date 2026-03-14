import { handleApiError, isAPIError } from '@/modules/user/lib/errors';
import { ApiErrorCodes } from '@/modules/user/types/api-errors';
import { HttpError } from '@/services/https-client/http-error';

describe('errors barrel exports', () => {
  it('re-exports handleApiError and isAPIError', () => {
    const mapped = handleApiError(new HttpError({ status: 401, message: 'unauthorized' }), 'Login');
    expect(mapped.code).toBe(ApiErrorCodes.AUTH);
    expect(isAPIError(mapped)).toBe(true);
  });
});
