import type { ReactNode } from 'react';

import type { ErrorReporter } from '@/services/types/error-reporting';

export interface ErrorFallbackProps {
  error?: Error;
  reset: () => void;
}

export interface AppErrorBoundaryProps {
  children: ReactNode;
  reporter?: ErrorReporter;
}

export interface AppErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}
