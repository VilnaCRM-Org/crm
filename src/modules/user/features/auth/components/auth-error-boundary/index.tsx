import { type JSX, useCallback } from 'react';

import UIErrorBoundary from '@/components/error-boundary/ui-error-boundary';
import type { ErrorFallbackProps } from '@/components/types/error-boundary';
import type { AuthErrorBoundaryProps } from '@auth/types/auth-error-boundary';
import authErrorReporter from '@auth/utils/auth-error-reporter';

import AuthErrorFallback from './auth-error-fallback';

export default function AuthErrorBoundary({
  children,
  fallback,
  onError,
}: AuthErrorBoundaryProps): JSX.Element {
  const renderFallback = useCallback(
    ({ error, recovery, reset, reload }: ErrorFallbackProps): JSX.Element => (
      <AuthErrorFallback
        error={error}
        recovery={recovery}
        reset={reset}
        reload={reload}
        fallback={fallback}
      />
    ),
    [fallback]
  );

  return (
    <UIErrorBoundary
      surface="auth"
      reporter={authErrorReporter}
      onError={onError}
      fallback={renderFallback}
    >
      {children}
    </UIErrorBoundary>
  );
}
