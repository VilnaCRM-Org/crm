// @jest-environment jsdom

import { ApiError } from '@/modules/user/lib/api-errors';
import LoginAPI from '@auth/repositories/login-api';
import { buildCredentials, buildLoginResponse } from '@tests/builders';

type HttpsClient = import('@/services/types/https-client/https-client').HttpsClient;

describe('LoginAPI', () => {
  const credentials = buildCredentials();

  it('returns the underlying client response on success', async () => {
    const loginResponse = buildLoginResponse();
    const httpsClient = {
      post: jest.fn().mockResolvedValue(loginResponse),
    } as unknown as HttpsClient;

    const api = new LoginAPI(httpsClient, { convert: jest.fn() } as never);

    await expect(api.login(credentials)).resolves.toEqual(loginResponse);
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
