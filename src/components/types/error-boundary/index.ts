import type { CSSObject } from '@emotion/react';
import type { ErrorInfo, ReactNode } from 'react';

import type { RecoverableError } from '@/lib/reliability/types/recoverable-error';
import type { ErrorReporter } from '@/services/types/error-reporting';

export type FallbackLandmark = 'main' | 'region';

export interface ErrorFallbackProps {
  error?: Error;
  recovery: RecoverableError;
  reset: () => void;
  reload?: () => void;
  landmark?: FallbackLandmark;
}

export type ErrorFallbackRenderer = (props: ErrorFallbackProps) => ReactNode;

export interface UIErrorBoundaryProps {
  children: ReactNode;
  surface: string;
  reporter: ErrorReporter;
  fallback?: ErrorFallbackRenderer;
  onError?: (error: Error, info: ErrorInfo) => void;
}

export interface UIErrorBoundaryState {
  error?: Error;
  recovery?: RecoverableError;
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
