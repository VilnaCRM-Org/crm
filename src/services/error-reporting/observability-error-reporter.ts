import { inject, injectable } from 'tsyringe';

import observabilityCore from '@/services/observability/observability-core';
import OBSERVABILITY_TOKENS from '@/services/observability/tokens';
import type { ErrorReporter } from '@/services/types/error-reporting';
import type { ObservabilityService } from '@/services/types/observability/observability';

@injectable()
export default class ObservabilityErrorReporter implements ErrorReporter {
  private readonly observability: ObservabilityService;

  constructor(
    @inject(OBSERVABILITY_TOKENS.ObservabilityService, { isOptional: true })
    observability?: ObservabilityService
  ) {
    this.observability = observability ?? observabilityCore;
  }

  public report(error: Error, context?: Record<string, unknown>): void {
    this.observability.captureError(error, context);
  }
}
