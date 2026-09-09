import { inject, injectable } from 'tsyringe';

import type { ErrorReporter } from '@/services/types/error-reporting';
import type {
  CaptureContext,
  ObservabilityService as ObservabilityServiceContract,
  ObservabilityUser,
  WebVitalMetric,
} from '@/services/types/observability/observability';

import type { ObservabilityCore } from './observability-core';
import OBSERVABILITY_TOKENS from './tokens';

@injectable()
export default class ObservabilityService implements ObservabilityServiceContract, ErrorReporter {
  constructor(
    @inject(OBSERVABILITY_TOKENS.ObservabilityCore) private readonly core: ObservabilityCore
  ) {}

  public init(): void {
    this.core.init();
  }

  public captureError(error: unknown, context?: CaptureContext): void {
    this.core.captureError(error, context);
  }

  public report(error: Error, context?: Record<string, unknown>): void {
    this.core.report(error, context);
  }

  public setUser(identity: ObservabilityUser): void {
    this.core.setUser(identity);
  }

  public clearUser(): void {
    this.core.clearUser();
  }

  public reportVital(metric: WebVitalMetric): void {
    this.core.reportVital(metric);
  }
}
