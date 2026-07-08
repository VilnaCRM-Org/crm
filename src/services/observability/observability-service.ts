import { injectable } from 'tsyringe';

import type { ErrorReporter } from '@/services/types/error-reporting';
import type {
  CaptureContext,
  ObservabilityService as ObservabilityServiceContract,
  ObservabilityUser,
  WebVitalMetric,
} from '@/services/types/observability/observability';

import observabilityCore from './observability-core';

@injectable()
export default class ObservabilityService implements ObservabilityServiceContract, ErrorReporter {
  public init(): void {
    observabilityCore.init();
  }

  public captureError(error: unknown, context?: CaptureContext): void {
    observabilityCore.captureError(error, context);
  }

  public report(error: Error, context?: Record<string, unknown>): void {
    observabilityCore.report(error, context);
  }

  public setUser(identity: ObservabilityUser): void {
    observabilityCore.setUser(identity);
  }

  public clearUser(): void {
    observabilityCore.clearUser();
  }

  public reportVital(metric: WebVitalMetric): void {
    observabilityCore.reportVital(metric);
  }
}
