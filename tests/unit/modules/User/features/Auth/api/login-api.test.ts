import { ApiError } from '@/modules/User/features/Auth/api/ApiErrors';
import LoginAPI from '@/modules/User/features/Auth/api/login-api';

type HttpsClient = import('@/services/HttpsClient/https-client').default;

describe('LoginAPI', () => {
  const credentials = { email: 'user@example.com', password: 'secret' };

  it('returns the underlying client response on success', async () => {
    const httpsClient = {
      post: jest.fn().mockResolvedValue({ token: 'abc123' }),
    } as unknown as HttpsClient;

    const api = new LoginAPI(httpsClient, { convert: jest.fn() } as never);

    await expect(api.login(credentials)).resolves.toEqual({ token: 'abc123' });
    expect(httpsClient.post).toHaveBeenCalledWith(
      expect.any(String),
      credentials,
      undefined
    );
  });

  it('maps non-API failures through BaseAPI handling', async () => {
    const httpsClient = {
      post: jest.fn().mockRejectedValue(new Error('network down')),
    } as unknown as HttpsClient;
    const converted = new ApiError({ message: 'Converted', code: 'CONVERTED' });
    const api = new LoginAPI(
      httpsClient,
      { convert: jest.fn().mockReturnValue(converted) } as never
    );

    await expect(api.login(credentials)).rejects.toBe(converted);
  });
});
