import { useEffect, useRef } from 'react';

import type { ErrorFallbackProps } from '@/components/types/error-boundary';

import errorFallbackStyles from './styles';

function ErrorDiagnostics({ error }: { error?: Error }): JSX.Element | null {
  if (process.env.NODE_ENV === 'production' || error == null) return null;
  return (
    <details style={errorFallbackStyles.build().details}>
      <summary>Error details</summary>
      <pre>{error.message}</pre>
    </details>
  );
}

export default function ErrorFallback({ error, reset }: ErrorFallbackProps): JSX.Element {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const styles = errorFallbackStyles.build();

  useEffect(() => {
    if (headingRef.current) headingRef.current.focus();
  }, []);

  return (
    <div lang="en" style={styles.container}>
      <div style={styles.messageBlock}>
        <h1 ref={headingRef} tabIndex={-1} style={styles.heading}>
          Something went wrong
        </h1>
        <p style={styles.description}>
          An unexpected error occurred. Please try refreshing the page or clicking the button below.
        </p>
      </div>
      <button type="button" onClick={reset} style={styles.resetButton}>
        Try again
      </button>
      <ErrorDiagnostics error={error} />
    </div>
  );
}
