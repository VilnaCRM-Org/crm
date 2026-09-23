import type { CSSObject } from '@emotion/react';
import type { ErrorInfo, ReactNode } from 'react';

import type { RecoverableError } from '@/lib/reliability/types/recoverable-error';
import type { ErrorReporter } from '@/services/types/error-reporting';

export type FallbackLandmark = 'main' | 'region';

export interface ErrorFallbackProps {
  error?: Error | undefined;
  recovery: RecoverableError;
  reset: () => void;
  reload?: (() => void) | undefined;
  landmark?: FallbackLandmark | undefined;
}

export type ErrorFallbackRenderer = (props: ErrorFallbackProps) => ReactNode;

export interface UIErrorBoundaryProps {
  children: ReactNode;
  surface: string;
  reporter: ErrorReporter;
  fallback?: ErrorFallbackRenderer;
  onError?: ((error: Error, info: ErrorInfo) => void) | undefined;
}

export interface UIErrorBoundaryState {
  error?: Error | undefined;
  recovery?: RecoverableError | undefined;
  attempt: number;
}

export interface RouteErrorProps {
  landmark: FallbackLandmark;
}

export type ErrorFallbackStyleToken =
  | 'container'
  | 'messageBlock'
  | 'heading'
  | 'description'
  | 'actions'
  | 'button'
  | 'link'
  | 'details';

export type ErrorFallbackStyleSheet = Record<ErrorFallbackStyleToken, CSSObject>;
