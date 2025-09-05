import React, { Component, ReactNode } from 'react';

interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface AuthErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((args: { error?: Error; reset: () => void }) => ReactNode);
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

export default class AuthErrorBoundary extends Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  // eslint-disable-next-line react/static-property-placement
  public static defaultProps: Partial<AuthErrorBoundaryProps> = {
    fallback: 'Something went wrong. Please try again later.',
    onError: undefined,
  };

  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): Partial<AuthErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, info: React.ErrorInfo): void {
    const { onError } = this.props;

    if (!onError && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('AuthErrorBoundary caught an error:', error, info);
    }
  }

  // eslint-disable-next-line react/sort-comp
  public render(): ReactNode {
    const { children, fallback } = this.props;
    const { hasError, error } = this.state;
    const renderedFallback =
      typeof fallback === 'function' ? fallback({ error, reset: this.handleReset }) : fallback;

    if (hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          data-testid="auth-error-boundary-fallback"
        >
          {renderedFallback}

          <button
            type="button"
            data-testid="auth-error-boundary-try-again"
            onClick={this.handleReset}
            style={{ marginTop: '1rem' }}
          >
            Try again
          </button>
          {process.env.NODE_ENV === 'development' && error && (
            <details style={{ marginTop: '1rem' }}>
              <summary>Error Details</summary>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{error.message}</pre>
            </details>
          )}
        </div>
      );
    }

    return children;
  }

  private handleReset = (): void => this.setState({ hasError: false, error: undefined });
}
