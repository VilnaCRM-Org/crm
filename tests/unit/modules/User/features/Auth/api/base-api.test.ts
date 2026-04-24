import ApiErrorConverter from '@/modules/User/features/Auth/api/api-error-converter';
import { ApiError } from '@/modules/User/features/Auth/api/ApiErrors';
import BaseAPI from '@/modules/User/features/Auth/api/base-api';

class TestAPI extends BaseAPI {
  public exposeHandleApiError(error: unknown, context: string): ApiError {
    return this.handleApiError(error, context);
  }
}

describe('BaseAPI', () => {
  it('returns ApiError instances unchanged', () => {
    const api = new TestAPI();
    const existing = new ApiError({ message: 'Existing', code: 'EXISTING' });

    expect(api.exposeHandleApiError(existing, 'Login')).toBe(existing);
  });

  it('delegates non-ApiError values to the injected converter', () => {
    const converter = { convert: jest.fn() } as unknown as ApiErrorConverter;
    const api = new TestAPI(converter);
    const converted = new ApiError({ message: 'Converted', code: 'CONVERTED' });

    (converter.convert as jest.Mock).mockReturnValue(converted);

    expect(api.exposeHandleApiError(new Error('boom'), 'Login')).toBe(converted);
    expect(converter.convert).toHaveBeenCalledWith(expect.any(Error), 'Login');
  });
});
