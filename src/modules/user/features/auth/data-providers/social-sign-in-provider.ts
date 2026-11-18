import { inject, injectable } from 'tsyringe';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { SocialSignInRepository } from '@auth/repositories';
import type SocialSignInTransformer from '@auth/transformers/social-sign-in-transformer';
import type { AuthStoreActionsDeps } from '@auth/types/auth-store-actions-deps';
import type { SocialCallbackResponse } from '@auth/types/social-sign-in/social-callback-response';
import type { SocialProvider } from '@auth/types/social-sign-in/social-provider';
import type {
  SocialCallbackParams,
  SocialSignInOutcome,
} from '@auth/types/social-sign-in/social-sign-in-outcome';

// The auth store and the security signals come from the same deps the password sign-in actions
// use, so a social sign-in writes the session and reports exactly as a password one does.
@injectable()
export default class SocialSignInProvider {
  constructor(
    @inject(AUTH_TOKENS.SocialSignInRepository) private readonly repository: SocialSignInRepository,
    @inject(AUTH_TOKENS.SocialSignInTransformer)
    private readonly transformer: SocialSignInTransformer,
    @inject(AUTH_TOKENS.AuthStoreActionsDeps) private readonly auth: AuthStoreActionsDeps
  ) {}

  public async complete(
    provider: SocialProvider,
    params: SocialCallbackParams,
    signal: AbortSignal
  ): Promise<SocialSignInOutcome> {
    try {
      return this.settle(await this.repository.callback(provider, params, signal));
    } catch (caught) {
      const outcome = this.transformer.fromFailure(caught, signal);
      if (outcome.kind === 'failed') this.auth.securitySignals.loginFailed(caught);
      return outcome;
    }
  }

  // The access token is kept exactly like a password sign-in's: in the memory-only auth store.
  // The refresh token is not read (the schema drops it), and a 2FA account gets no token here.
  private settle(response: SocialCallbackResponse | undefined): SocialSignInOutcome {
    if (response !== undefined && !response['2fa_enabled']) {
      this.auth.authState.setState({ token: response.access_token, loginError: null });
      this.auth.securitySignals.signedIn();
    }
    return this.transformer.toOutcome(response);
  }
}
