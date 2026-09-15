import type { ErrorInfo, ReactNode } from 'react';

import type { ErrorFallbackProps } from '@/components/types/error-boundary';

export interface AuthFallbackRenderArgs {
  error?: Error;
  reset: () => void;
}

export type AuthErrorFallbackContent = ReactNode | ((args: AuthFallbackRenderArgs) => ReactNode);

export interface AuthErrorBoundaryProps {
  children: ReactNode;
  fallback?: AuthErrorFallbackContent;
  onError?: (error: Error, info: ErrorInfo) => void;
}

export interface AuthErrorFallbackProps extends Pick<
  ErrorFallbackProps,
  'error' | 'recovery' | 'reset' | 'reload'
> {
  fallback?: AuthErrorFallbackContent;
}
