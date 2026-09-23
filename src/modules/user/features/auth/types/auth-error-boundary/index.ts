import type { ErrorInfo, ReactNode } from 'react';

import type { ErrorFallbackProps } from '@/components/types/error-boundary';

export interface AuthFallbackRenderArgs {
  error?: Error | undefined;
  reset: () => void;
}

export type AuthErrorFallbackContent = ReactNode | ((args: AuthFallbackRenderArgs) => ReactNode);

export interface AuthErrorBoundaryProps {
  children: ReactNode;
  fallback?: AuthErrorFallbackContent;
  onError?: ((error: Error, info: ErrorInfo) => void) | undefined;
}

export interface AuthErrorFallbackProps extends Pick<
  ErrorFallbackProps,
  'error' | 'recovery' | 'reset' | 'reload'
> {
  fallback?: AuthErrorFallbackContent;
}
