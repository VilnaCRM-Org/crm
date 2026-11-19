import { inject, injectable } from 'tsyringe';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { GraphQLSocialSignInRepository } from '@auth/repositories';
import type SocialSignInTransformer from '@auth/transformers/social-sign-in-transformer';
import type { AuthStoreActionsDeps } from '@auth/types/auth-store-actions-deps';
import type { SocialProvider } from '@auth/types/social-sign-in/social-provider';
import type {
  SocialCallbackParams,
  SocialSignInOutcome,
  SocialStartOutcome,
} from '@auth/types/social-sign-in/social-sign-in-outcome';
import type { SocialCompletion } from '@auth/types/social-sign-in/social-sign-in-result';

// The auth store and the security signals come from the same deps the password sign-in actions
// use, so a social sign-in writes the session and reports exactly as a password one does.
@injectable()
export default class SocialSignInProvider {
  constructor(
    @inject(AUTH_TOKENS.SocialSignInRepository)
    private readonly repository: GraphQLSocialSignInRepository,
    @inject(AUTH_TOKENS.SocialSignInTransformer)
    private readonly transformer: SocialSignInTransformer,
    @inject(AUTH_TOKENS.AuthStoreActionsDeps) private readonly auth: AuthStoreActionsDeps
  ) {}

  public async start(provider: SocialProvider, signal: AbortSignal): Promise<SocialStartOutcome> {
    try {
      return this.transformer.toStart(await this.repository.initiate(provider, signal));
    } catch (caught) {
      return this.transformer.fromFailure(caught, signal);
    }
  }

  public async complete(
    provider: SocialProvider,
    params: SocialCallbackParams,
    signal: AbortSignal
  ): Promise<SocialSignInOutcome> {
    try {
      return this.settle(await this.repository.complete(provider, params, signal));
    } catch (caught) {
      const outcome = this.transformer.fromFailure(caught, signal);
      if (outcome.kind === 'failed') this.auth.securitySignals.loginFailed(caught);
      return outcome;
    }
  }

  // The access token is kept exactly like a password sign-in's: in the memory-only auth store.
  // A 2FA account gets no token here.
  private settle(completion: SocialCompletion): SocialSignInOutcome {
    if (completion.twoFactorEnabled !== true) {
      this.auth.authState.setState({ token: completion.accessToken, loginError: null });
      this.auth.securitySignals.signedIn();
    }
    return this.transformer.toOutcome(completion);
  }
}
