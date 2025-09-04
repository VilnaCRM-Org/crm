import React, { Component, ReactNode } from 'react';

interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface AuthErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
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

    onError?.(error, info);
  }

  public render(): ReactNode {
    const { children, fallback } = this.props;
    const { hasError, error } = this.state;

    if (hasError) {
      return (
        <div role="alert" aria-live="assertive" data-testid="auth-error-boundary-fallback">
          {fallback}
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: undefined })}
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
}
