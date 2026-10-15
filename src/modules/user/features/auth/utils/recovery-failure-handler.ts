import type { ApolloError } from '@apollo/client';
import { inject, injectable } from 'tsyringe';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import type UserServiceErrorTransformer from '@/modules/user/transformers';
import OBSERVABILITY_TOKENS from '@/services/observability/tokens';
import type { ObservabilityService } from '@/services/types/observability/observability';
import type PasswordRecoveryTransformer from '@auth/transformers/password-recovery-transformer';
import type { RecoveryFailedOutcome, RecoveryStep } from '@auth/types/password-recovery/outcome';

@injectable()
export default class RecoveryFailureHandler {
  constructor(
    @inject(AUTH_TOKENS.UserServiceErrorTransformer)
    private readonly errors: UserServiceErrorTransformer,
    @inject(AUTH_TOKENS.PasswordRecoveryTransformer)
    private readonly transformer: PasswordRecoveryTransformer,
    @inject(OBSERVABILITY_TOKENS.ObservabilityService)
    private readonly observability: ObservabilityService
  ) {}

  public handle(step: RecoveryStep, caught: unknown, signal: AbortSignal): RecoveryFailedOutcome {
    const failure = this.errors.normalize(caught, signal);
    if (failure.reason === 'unknown' && !this.reachedTheLink(caught)) {
      this.observability.captureError(caught, { source: 'auth:password-recovery', stage: step });
    }
    return this.transformer.fromFailure(step, failure);
  }

  private reachedTheLink(caught: unknown): boolean {
    const { networkError, graphQLErrors } = (caught ?? {}) as Partial<ApolloError>;
    return Boolean(networkError) || (graphQLErrors?.length ?? 0) > 0;
  }
}
