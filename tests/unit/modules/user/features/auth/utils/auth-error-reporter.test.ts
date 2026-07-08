import type { ErrorInfo } from 'react';

import authErrorReporter, {
  AuthErrorReporter,
} from '@/modules/user/features/auth/utils/auth-error-reporter';
import observabilityCore from '@/services/observability/observability-core';

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

  it('exports a shared singleton instance', () => {
    expect(authErrorReporter).toBeInstanceOf(AuthErrorReporter);
  });
});
