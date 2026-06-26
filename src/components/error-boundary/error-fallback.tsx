import { useEffect, useRef } from 'react';

import type { ErrorFallbackProps } from '@/components/types/error-boundary';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem',
    backgroundColor: '#FFFFFF',
    color: '#1A1C1E',
    fontFamily: 'sans-serif',
    boxSizing: 'border-box' as const,
  },
  messageBlock: {
    textAlign: 'center' as const,
    maxWidth: '36rem',
  },
  heading: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1A1C1E',
    margin: '0 0 1rem',
    outline: 'none',
  },
  description: {
    fontSize: '1rem',
    color: '#1A1C1E',
    margin: '0 0 1.5rem',
    lineHeight: 1.5,
  },
  resetButton: {
    marginTop: '1.5rem',
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1A1C1E',
    backgroundColor: '#1EAEFF',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  details: {
    marginTop: '1.5rem',
    maxWidth: '36rem',
    textAlign: 'left' as const,
    fontSize: '0.875rem',
    color: '#1A1C1E',
  },
};

function ErrorDiagnostics({ error }: { error?: Error }): JSX.Element | null {
  if (process.env.NODE_ENV === 'production' || error == null) return null;
  return (
    <details style={styles.details}>
      <summary>Error details</summary>
      <pre>{error.message}</pre>
    </details>
  );
}

export default function ErrorFallback({ error, reset }: ErrorFallbackProps): JSX.Element {
  const headingRef = useRef<HTMLHeadingElement>(null);

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
