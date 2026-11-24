import { inject, injectable } from 'tsyringe';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { GraphQLSocialSignInRepository } from '@auth/repositories';
import type SocialSignInTransformer from '@auth/transformers/social-sign-in-transformer';
import type { SocialProvider } from '@auth/types/social-sign-in/social-provider';
import type { SocialSignInDeps } from '@auth/types/social-sign-in/social-sign-in-deps';
import type {
  SocialCallbackParams,
  SocialFailureOutcome,
  SocialSignInOutcome,
  SocialStartOutcome,
} from '@auth/types/social-sign-in/social-sign-in-outcome';
import type { SocialCompletion } from '@auth/types/social-sign-in/social-sign-in-result';

// The auth store, the security signals and the earlier session are the ones a password sign-in
// uses, so a social sign-in starts a session and reports exactly as a password one does.
@injectable()
export default class SocialSignInProvider {
  constructor(
    @inject(AUTH_TOKENS.SocialSignInRepository)
    private readonly repository: GraphQLSocialSignInRepository,
    @inject(AUTH_TOKENS.SocialSignInTransformer)
    private readonly transformer: SocialSignInTransformer,
    @inject(AUTH_TOKENS.SocialSignInDeps) private readonly deps: SocialSignInDeps
  ) {}

  public async start(provider: SocialProvider, signal: AbortSignal): Promise<SocialStartOutcome> {
    try {
      return this.transformer.toStart(await this.repository.initiate(provider, signal));
    } catch (caught) {
      return this.failed(caught, signal);
    }
  }

  public async complete(
    provider: SocialProvider,
    params: SocialCallbackParams,
    signal: AbortSignal
  ): Promise<SocialSignInOutcome> {
    const superseded = new AbortController();
    const stopWatching = this.onSessionChange(() => superseded.abort());
    try {
      const completion = await this.repository.complete(provider, params, signal);
      const dropped = signal.aborted || superseded.signal.aborted;
      return dropped ? { kind: 'aborted' } : this.settle(completion);
    } catch (caught) {
      return this.failed(caught, signal);
    } finally {
      stopWatching();
    }
  }

  private failed(caught: unknown, signal: AbortSignal): SocialFailureOutcome {
    const outcome = this.transformer.fromFailure(caught, signal);
    if (outcome.kind === 'failed') {
      this.deps.securitySignals.loginFailed(this.transformer.signalOf(caught));
    }
    return outcome;
  }

  private settle(completion: SocialCompletion): SocialSignInOutcome {
    this.endEarlierSession();
    const { signedOut } = this.deps;
    if (completion.twoFactorEnabled === true) {
      this.deps.authState.setState({ ...signedOut, pendingSessionId: completion.pendingSessionId });
    } else {
      this.deps.authState.setState({
        ...signedOut,
        token: completion.accessToken,
        twoFactorStatus: 'disabled',
      });
      this.deps.securitySignals.signedIn();
    }
    return this.transformer.toOutcome(completion);
  }

  private onSessionChange(notify: VoidFunction): VoidFunction {
    return this.deps.authState.subscribe((now, before) => {
      if (now.token !== before.token || now.pendingSessionId !== before.pendingSessionId) notify();
    });
  }

  private endEarlierSession(): void {
    if (this.deps.session.token() !== null) this.deps.session.signOut();
  }
}
