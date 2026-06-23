import type { ErrorInfo, ReactNode } from 'react';

export interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export interface AuthErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((args: { error?: Error; reset: () => void }) => ReactNode);
  onError?: (error: Error, info: ErrorInfo) => void;
}
