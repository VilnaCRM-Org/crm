import type { ErrorInfo } from 'react';

import authErrorReporter, {
  AuthErrorReporter,
} from '@/modules/user/features/auth/utils/auth-error-reporter';
import observabilityCore from '@/services/observability/observability-core';
import securityEventCore from '@/services/security-events/security-event-core';

describe('AuthErrorReporter', () => {
  it('forwards auth errors to observability with component context', () => {
    const captureSpy = jest.spyOn(observabilityCore, 'captureError').mockImplementation(() => {});
    const error = new Error('auth boom');
    const info = { componentStack: '\n    at Auth' } as ErrorInfo;

    new AuthErrorReporter().report(error, info);

    expect(captureSpy).toHaveBeenCalledWith(error, {
      componentStack: info.componentStack,
      surface: 'auth',
    });
    captureSpy.mockRestore();
  });

  it('emits an auth boundary-catch security event alongside the capture', () => {
    jest.spyOn(observabilityCore, 'captureError').mockImplementation(() => {});
    const boundaryCatch = jest.spyOn(securityEventCore, 'boundaryCatch').mockImplementation();

    new AuthErrorReporter().report(new Error('auth boom'), {
      componentStack: '\n    at Auth',
    } as ErrorInfo);

    expect(boundaryCatch).toHaveBeenCalledWith('auth');
    jest.restoreAllMocks();
  });

  it('exports a shared singleton instance', () => {
    expect(authErrorReporter).toBeInstanceOf(AuthErrorReporter);
  });
});
