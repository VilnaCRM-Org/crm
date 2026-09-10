import type { ErrorInfo } from 'react';

import observabilityCore from '@/services/observability/observability-core';
import securityEventCore from '@/services/security-events/security-event-core';

export class AuthErrorReporter {
  public report(error: Error, info: ErrorInfo): void {
    securityEventCore.boundaryCatch('auth');
    observabilityCore.captureError(error, {
      componentStack: info.componentStack,
      surface: 'auth',
    });
  }
}

const authErrorReporter = new AuthErrorReporter();

export default authErrorReporter;
