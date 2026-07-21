import type { ErrorInfo } from 'react';

import observabilityCore from '@/services/observability/observability-core';

export class AuthErrorReporter {
  public report(error: Error, info: ErrorInfo): void {
    observabilityCore.captureError(error, {
      componentStack: info.componentStack,
      surface: 'auth',
    });
  }
}

const authErrorReporter = new AuthErrorReporter();

export default authErrorReporter;
