import observabilityCore from '@/services/observability/observability-core';
import securityEventCore from '@/services/security-events/security-event-core';
import type { ErrorReporter } from '@/services/types/error-reporting';

export class BoundaryErrorReporter implements ErrorReporter {
  public report(error: Error, context?: Record<string, unknown>): void {
    securityEventCore.boundaryCatch(String(context?.surface ?? 'app'));
    observabilityCore.captureError(error, context);
  }
}

const boundaryErrorReporter = new BoundaryErrorReporter();

export default boundaryErrorReporter;
