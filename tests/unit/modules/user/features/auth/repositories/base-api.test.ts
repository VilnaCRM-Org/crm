import { ApiError } from '@/modules/user/types/api-errors';
import ApiErrorFactory from '@auth/repositories/api-error-factory';
import BaseAPI from '@auth/repositories/base-api';

class TestAPI extends BaseAPI {
  public exposeHandleApiError(error: unknown, context: string): ApiError {
    return this.handleApiError(error, context);
  }
}

describe('BaseAPI', () => {
  it('returns ApiError instances unchanged', () => {
    const api = new TestAPI({ convert: jest.fn() } as unknown as ApiErrorFactory);
    const existing = new ApiError({ message: 'Existing', code: 'EXISTING' });

    expect(api.exposeHandleApiError(existing, 'Login')).toBe(existing);
  });

  it('delegates non-ApiError values to the injected factory', () => {
    const factory = { convert: jest.fn() } as unknown as ApiErrorFactory;
    const api = new TestAPI(factory);
    const converted = new ApiError({ message: 'Converted', code: 'CONVERTED' });

    (factory.convert as jest.Mock).mockReturnValue(converted);

    expect(api.exposeHandleApiError(new Error('boom'), 'Login')).toBe(converted);
    expect(factory.convert).toHaveBeenCalledWith(expect.any(Error), 'Login');
  });
});
