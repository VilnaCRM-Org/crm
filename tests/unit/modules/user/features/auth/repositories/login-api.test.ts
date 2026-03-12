// @jest-environment node

import LoginAPI from '@/modules/user/features/auth/repositories/login-api';
import { ApiErrorCodes } from '@/modules/user/types/api-errors';
import { HttpError } from '@/services/https-client/http-error';
import type HttpsClient from '@/services/https-client/https-client';

function makeHttpsClient(post: jest.Mock): HttpsClient {
  return { post } as unknown as HttpsClient;
}

describe('LoginAPI', () => {
  it('returns the API response on success', async () => {
    const postMock = jest.fn().mockResolvedValue({ token: 'abc123' });
    const api = new LoginAPI(makeHttpsClient(postMock));

    const result = await api.login({ email: 'user@example.com', password: 'Password1' });

    expect(result).toEqual({ token: 'abc123' });
  });

  it('wraps HttpError in an ApiError via handleApiError', async () => {
    const postMock = jest.fn().mockRejectedValue(new HttpError({ status: 401, message: 'Unauthorized' }));
    const api = new LoginAPI(makeHttpsClient(postMock));

    await expect(
      api.login({ email: 'user@example.com', password: 'Password1' })
    ).rejects.toMatchObject({ code: ApiErrorCodes.AUTH });
  });

  it('wraps unknown errors in an ApiError via handleApiError', async () => {
    const postMock = jest.fn().mockRejectedValue(new Error('Unknown'));
    const api = new LoginAPI(makeHttpsClient(postMock));

    await expect(
      api.login({ email: 'user@example.com', password: 'Password1' })
    ).rejects.toMatchObject({ code: ApiErrorCodes.UNKNOWN });
  });
});
