import { inject, injectable } from 'tsyringe';

import OBSERVABILITY_TOKENS from '@/services/observability/tokens';
import type { ErrorReporter } from '@/services/types/error-reporting';
import type { ObservabilityService } from '@/services/types/observability/observability';

@injectable()
export default class ObservabilityErrorReporter implements ErrorReporter {
  private readonly observability?: ObservabilityService;

  // The service is optional so a reporter resolved before the DI graph is composed still reports
  // through the container-free core, which the observability root registers by value (issue #130).
  constructor(
    @inject(OBSERVABILITY_TOKENS.ObservabilityService, { isOptional: true })
    observability?: ObservabilityService,
    @inject(OBSERVABILITY_TOKENS.ObservabilityCore, { isOptional: true })
    core?: ObservabilityService
  ) {
    this.observability = observability ?? core;
  }

  public report(error: Error, context?: Record<string, unknown>): void {
    this.observability?.captureError(error, context);
  }
}
