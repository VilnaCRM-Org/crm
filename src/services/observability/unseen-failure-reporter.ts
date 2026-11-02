import type { ApolloError } from '@apollo/client';
import { inject, injectable } from 'tsyringe';

import type {
  CaptureContext,
  ObservabilityService,
} from '@/services/types/observability/observability';

import OBSERVABILITY_TOKENS from './tokens';

@injectable()
export default class UnseenFailureReporter {
  constructor(
    @inject(OBSERVABILITY_TOKENS.ObservabilityService)
    private readonly observability: ObservabilityService
  ) {}

  public report(caught: unknown, context: CaptureContext): void {
    if (!this.reachedTheLink(caught)) {
      this.observability.captureError(caught, context);
    }
  }

  private reachedTheLink(caught: unknown): boolean {
    if (!(caught instanceof Error)) return false;
    const { networkError, graphQLErrors } = caught as Partial<ApolloError>;
    return Boolean(networkError) || (Array.isArray(graphQLErrors) && graphQLErrors.length > 0);
  }
}
