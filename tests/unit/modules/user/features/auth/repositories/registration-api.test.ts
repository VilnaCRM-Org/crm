import API_ENDPOINTS from '@/config/api-config';
import { ApiError } from '@/modules/user/types/api-errors';
import RegistrationAPI from '@auth/repositories/registration-api';

type HttpsClient = import('@/services/https-client/https-client').default;

describe('RegistrationAPI', () => {
  const credentials = {
    email: 'user@example.com',
    password: 'secret',
    fullName: 'Test User',
  };

  it('returns the underlying client response on success', async () => {
    const httpsClient = {
      post: jest
        .fn()
        .mockResolvedValue({ email: credentials.email, fullName: credentials.fullName }),
    } as unknown as HttpsClient;

    const api = new RegistrationAPI(httpsClient, { convert: jest.fn() } as never);

    await expect(api.register(credentials)).resolves.toEqual({
      email: credentials.email,
      fullName: credentials.fullName,
    });
    expect(httpsClient.post).toHaveBeenCalledWith(API_ENDPOINTS.REGISTER, credentials, undefined);
  });

  it('passes request options to the underlying client', async () => {
    const httpsClient = {
      post: jest.fn().mockResolvedValue(undefined),
    } as unknown as HttpsClient;
    const api = new RegistrationAPI(httpsClient, { convert: jest.fn() } as never);
    const options = { signal: new AbortController().signal };

    await expect(api.register(credentials, options)).resolves.toBeUndefined();

    expect(httpsClient.post).toHaveBeenCalledWith(API_ENDPOINTS.REGISTER, credentials, options);
  });

  it('rethrows AbortError without converting it', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    const httpsClient = {
      post: jest.fn().mockRejectedValue(abortError),
    } as unknown as HttpsClient;
    const converter = { convert: jest.fn() };
    const api = new RegistrationAPI(httpsClient, converter as never);

    await expect(api.register(credentials)).rejects.toBe(abortError);
    expect(converter.convert).not.toHaveBeenCalled();
  });

  it('maps non-abort failures through BaseAPI handling', async () => {
    const httpsClient = {
      post: jest.fn().mockRejectedValue(new Error('network down')),
    } as unknown as HttpsClient;
    const converted = new ApiError({ message: 'Converted', code: 'CONVERTED' });
    const api = new RegistrationAPI(httpsClient, {
      convert: jest.fn().mockReturnValue(converted),
    } as never);

    await expect(api.register(credentials)).rejects.toBe(converted);
  });
});
