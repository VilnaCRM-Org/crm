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

const DEFAULT_FALLBACK: ReactNode = 'Something went wrong. Please try again later.';

const shouldShowErrorDetails = (error: Error | undefined): error is Error =>
  Boolean(error) && (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test');

function ErrorDetails({ error }: { error: Error }): JSX.Element {
  return (
    <details style={{ marginTop: '1rem' }}>
      <summary>Error Details</summary>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{error.message}</pre>
    </details>
  );
}

function FallbackContainer({
  fallback,
  error,
  onReset,
}: {
  fallback: ReactNode;
  error?: Error;
  onReset: () => void;
}): JSX.Element {
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      data-testid="auth-error-boundary-fallback"
    >
      {fallback}
      <button
        type="button"
        data-testid="auth-error-boundary-try-again"
        onClick={onReset}
        style={{ marginTop: '1rem' }}
      >
        Try again
      </button>
      {shouldShowErrorDetails(error) && <ErrorDetails error={error} />}
    </div>
  );
}

export default class AuthErrorBoundary extends Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
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

  public handleReset = (): void => this.setState({ hasError: false, error: undefined });

  public render(): ReactNode {
    const { children, fallback = DEFAULT_FALLBACK } = this.props;
    const { hasError, error } = this.state;
    if (!hasError) return children;
    const rendered =
      typeof fallback === 'function' ? fallback({ error, reset: this.handleReset }) : fallback;
    return <FallbackContainer fallback={rendered} error={error} onReset={this.handleReset} />;
  }
}
