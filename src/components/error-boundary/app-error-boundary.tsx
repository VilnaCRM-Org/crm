import React from 'react';

import type {
  AppErrorBoundaryProps,
  AppErrorBoundaryState,
} from '@/components/types/error-boundary';
import { noopErrorReporter } from '@/services/error-reporting';

import ErrorFallback from './error-fallback';

export default class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  public state: AppErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, info: React.ErrorInfo): void {
    const reporter = this.props.reporter ?? noopErrorReporter;
    try {
      reporter.report(error, { componentStack: info.componentStack });
    } catch (reportingError) {
      this.logDev('[AppErrorBoundary:report]', reportingError);
    }
    this.logDev('[AppErrorBoundary]', error, info.componentStack);
  }

  public handleReset = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} reset={this.handleReset} />;
    }
    return this.props.children;
  }

  private logDev(...args: unknown[]): void {
    if (process.env.NODE_ENV !== 'production') {
      console.error(...args);
    }
  }
}
