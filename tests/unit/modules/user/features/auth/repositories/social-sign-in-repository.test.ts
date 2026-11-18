import 'reflect-metadata';

import API_ENDPOINTS from '@/config/api-config';
import type { HttpsClient } from '@/services/types/https-client/https-client';
import SocialSignInRepository from '@auth/repositories/social-sign-in-repository';
import { SocialCallbackResponseSchema } from '@auth/utils/response-schemas';
import { buildToken } from '@tests/builders';

describe('SocialSignInRepository', () => {
  it('relays code and state to the provider callback with credentials and no retry', async () => {
    const response = { '2fa_enabled': false, access_token: buildToken() } as const;
    const get = jest.fn().mockResolvedValue(response);
    const repository = new SocialSignInRepository({ get } as unknown as HttpsClient);
    const { signal } = new AbortController();

    await expect(
      repository.callback('github', { code: 'a code/with=chars', state: 's-1' }, signal)
    ).resolves.toBe(response);

    expect(get).toHaveBeenCalledWith(
      `${API_ENDPOINTS.SOCIAL_AUTH}/github/callback?code=a+code%2Fwith%3Dchars&state=s-1`,
      { schema: SocialCallbackResponseSchema, signal, credentials: 'include', retry: false }
    );
    expect(API_ENDPOINTS.SOCIAL_AUTH.endsWith('/api/auth/social')).toBe(true);
  });
});
