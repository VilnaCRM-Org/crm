import boundaryErrorReporter from '@/services/error-reporting/boundary-error-reporter';
import type { ErrorReporter } from '@/services/types/error-reporting';

export class AuthErrorReporter implements ErrorReporter {
  public report(error: Error, context?: Record<string, unknown>): void {
    boundaryErrorReporter.report(error, { ...context, surface: 'auth' });
  }
}

const authErrorReporter = new AuthErrorReporter();

export default authErrorReporter;
