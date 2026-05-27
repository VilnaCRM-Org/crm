// @jest-environment jsdom

import { ApiError } from '@/modules/user/types/api-errors';
import LoginAPI from '@auth/repositories/login-api';

type HttpsClient = import('@/services/https-client/https-client').default;

describe('LoginAPI', () => {
  const credentials = { email: 'user@example.com', password: 'secret' };

  it('returns the underlying client response on success', async () => {
    const httpsClient = {
      post: jest.fn().mockResolvedValue({ token: 'abc123' }),
    } as unknown as HttpsClient;

    const api = new LoginAPI(httpsClient, { convert: jest.fn() } as never);

    await expect(api.login(credentials)).resolves.toEqual({ token: 'abc123' });
    expect(httpsClient.post).toHaveBeenCalledWith(expect.any(String), credentials, undefined);
  });

  it('passes request options to the underlying client', async () => {
    const httpsClient = {
      post: jest.fn().mockResolvedValue(undefined),
    } as unknown as HttpsClient;
    const api = new LoginAPI(httpsClient, { convert: jest.fn() } as never);
    const options = { signal: new AbortController().signal };

    await expect(api.login(credentials, options)).resolves.toBeUndefined();

    expect(httpsClient.post).toHaveBeenCalledWith(expect.any(String), credentials, options);
  });

  it('maps non-API failures through BaseAPI handling', async () => {
    const httpsClient = {
      post: jest.fn().mockRejectedValue(new Error('network down')),
    } as unknown as HttpsClient;
    const converted = new ApiError({ message: 'Converted', code: 'CONVERTED' });
    const api = new LoginAPI(httpsClient, {
      convert: jest.fn().mockReturnValue(converted),
    } as never);

    await expect(api.login(credentials)).rejects.toBe(converted);
  });
});
