// @jest-environment node

import RegistrationAPI from '@/modules/User/features/Auth/repositories/registration-api';
import { ApiErrorCodes } from '@/modules/User/types/api-errors';
import { HttpError } from '@/services/https-client/http-error';
import type HttpsClient from '@/services/https-client/https-client';

function makeHttpsClient(post: jest.Mock): HttpsClient {
  return { post } as unknown as HttpsClient;
}

describe('RegistrationAPI', () => {
  it('returns the API response on success', async () => {
    const postMock = jest
      .fn()
      .mockResolvedValue({ email: 'ada@example.com', fullName: 'Ada Lovelace' });
    const api = new RegistrationAPI(makeHttpsClient(postMock));

    const result = await api.register({
      email: 'ada@example.com',
      fullName: 'Ada Lovelace',
      password: 'Password1',
    });

    expect(result).toEqual({ email: 'ada@example.com', fullName: 'Ada Lovelace' });
  });

  it('re-throws AbortError without wrapping', async () => {
    const abortError = new Error('The user aborted a request.');
    abortError.name = 'AbortError';
    const postMock = jest.fn().mockRejectedValue(abortError);
    const api = new RegistrationAPI(makeHttpsClient(postMock));

    await expect(
      api.register({ email: 'ada@example.com', fullName: 'Ada Lovelace', password: 'Password1' })
    ).rejects.toBe(abortError);
  });

  it('wraps HttpError via handleApiError', async () => {
    const postMock = jest
      .fn()
      .mockRejectedValue(new HttpError({ status: 409, message: 'Conflict' }));
    const api = new RegistrationAPI(makeHttpsClient(postMock));

    await expect(
      api.register({ email: 'ada@example.com', fullName: 'Ada Lovelace', password: 'Password1' })
    ).rejects.toMatchObject({ code: ApiErrorCodes.CONFLICT });
  });

  it('wraps unknown errors via handleApiError', async () => {
    const postMock = jest.fn().mockRejectedValue(new Error('Something went wrong'));
    const api = new RegistrationAPI(makeHttpsClient(postMock));

    await expect(
      api.register({ email: 'ada@example.com', fullName: 'Ada Lovelace', password: 'Password1' })
    ).rejects.toMatchObject({ code: ApiErrorCodes.UNKNOWN });
  });
});
