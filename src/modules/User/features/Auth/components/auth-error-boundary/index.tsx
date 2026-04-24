import styled from '@emotion/styled';
import React, { Component, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface AuthErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((args: { error?: Error; reset: () => void }) => ReactNode);
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

const DEFAULT_FALLBACK_KEY = 'auth.error.default';

const shouldShowErrorDetails = (error: Error | undefined): error is Error =>
  Boolean(error) && (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test');

const DetailsContainer = styled('details')({
  marginTop: '1rem',
});

const SummaryStyled = styled('summary')({
  cursor: 'pointer',
});

const RetryButton = styled('button')({
  marginTop: '1rem',
});

function ErrorDetails({ error }: { error: Error }): JSX.Element {
  const { t } = useTranslation();

  return (
    <DetailsContainer>
      <SummaryStyled>{t('auth.error.details')}</SummaryStyled>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{error.message}</pre>
    </DetailsContainer>
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
  const { t } = useTranslation();
  const resolvedFallback = fallback === DEFAULT_FALLBACK_KEY ? t(DEFAULT_FALLBACK_KEY) : fallback;

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      data-testid="auth-error-boundary-fallback"
    >
      {resolvedFallback}
      <RetryButton
        type="button"
        data-testid="auth-error-boundary-try-again"
        onClick={onReset}
      >
        {t('auth.error.tryAgain')}
      </RetryButton>
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
    const { children, fallback = DEFAULT_FALLBACK_KEY } = this.props;
    const { hasError, error } = this.state;
    if (!hasError) return children;
    const rendered =
      typeof fallback === 'function' ? fallback({ error, reset: this.handleReset }) : fallback;
    return <FallbackContainer fallback={rendered} error={error} onReset={this.handleReset} />;
  }
}
