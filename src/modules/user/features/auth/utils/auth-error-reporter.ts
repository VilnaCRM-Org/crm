import boundaryErrorReporter from '@/services/error-reporting/boundary-error-reporter';
import type { ErrorReporter } from '@/services/types/error-reporting';
import type { CaptureContext } from '@/services/types/observability/observability';

export class AuthErrorReporter implements ErrorReporter {
  public report(error: Error, context?: CaptureContext): void {
    boundaryErrorReporter.report(error, { ...context, surface: 'auth' });
  }
}

const authErrorReporter = new AuthErrorReporter();

export default authErrorReporter;
