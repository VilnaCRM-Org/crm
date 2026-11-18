import { inject, injectable } from 'tsyringe';

import API_ENDPOINTS from '@/config/api-config';
import HTTP_TOKENS from '@/services/https-client/tokens';
import type { HttpsClient } from '@/services/types/https-client/https-client';
import type { SocialCallbackResponse } from '@auth/types/social-sign-in/social-callback-response';
import type { SocialProvider } from '@auth/types/social-sign-in/social-provider';
import type { SocialCallbackParams } from '@auth/types/social-sign-in/social-sign-in-outcome';
import { SocialCallbackResponseSchema } from '@auth/utils/response-schemas';

// Relays the provider's code and state to user-service. The request is credentialed so the
// flow-binding cookie the initiate redirect set reaches the API, and it is never retried: the
// code is single-use, so a transport-level repeat could only fail with invalid_state.
@injectable()
export default class SocialSignInRepository {
  constructor(@inject(HTTP_TOKENS.HttpsClient) private readonly httpsClient: HttpsClient) {}

  public callback(
    provider: SocialProvider,
    params: SocialCallbackParams,
    signal: AbortSignal
  ): Promise<SocialCallbackResponse | undefined> {
    const query = new URLSearchParams({ code: params.code, state: params.state });

    return this.httpsClient.get(`${API_ENDPOINTS.SOCIAL_AUTH}/${provider}/callback?${query}`, {
      schema: SocialCallbackResponseSchema,
      signal,
      credentials: 'include',
      retry: false,
    });
  }
}
