import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';

import AuthErrorBoundary from '@auth/components/auth-error-boundary';

const DETAILS_LABEL = 'auth.error.details';
const FALLBACK_LABEL = 'auth.error.default';
const RETRY_LABEL = 'auth.error.tryAgain';
const FAILURE_MESSAGE = 'stack trace line one\nstack trace line two';

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

function ThrowingChild({ thrown }: { thrown: unknown }): ReactElement {
  throw thrown;
}

function renderBoundary(thrown: unknown): void {
  render(
    <AuthErrorBoundary>
      <ThrowingChild thrown={thrown} />
    </AuthErrorBoundary>
  );
}

function rawText(value: string): string {
  return value;
}

function withNodeEnv(value: string, run: () => void): void {
  const original = process.env.NODE_ENV;
  Object.defineProperty(process.env, 'NODE_ENV', { value, configurable: true });
  try {
    run();
  } finally {
    Object.defineProperty(process.env, 'NODE_ENV', { value: original, configurable: true });
  }
}

describe('AuthErrorBoundary error details', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows the failure message with its line breaks preserved outside production', () => {
    renderBoundary(new Error(FAILURE_MESSAGE));

    expect(screen.getByText(DETAILS_LABEL)).toBeInTheDocument();
    const message = screen.getByText(FAILURE_MESSAGE, { normalizer: rawText });
    expect(message.tagName).toBe('PRE');
    expect(message).toHaveStyle({ whiteSpace: 'pre-wrap' });
  });

  it('hides the failure message in production while still offering a retry', () => {
    withNodeEnv('production', () => {
      renderBoundary(new Error(FAILURE_MESSAGE));

      expect(screen.queryByText(DETAILS_LABEL)).not.toBeInTheDocument();
      expect(screen.queryByText(FAILURE_MESSAGE, { normalizer: rawText })).not.toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent(FALLBACK_LABEL);
      expect(screen.getByRole('button', { name: RETRY_LABEL })).toBeInTheDocument();
    });
  });

  it('renders no details section when the thrown value carries no error object', () => {
    renderBoundary(undefined);

    expect(screen.getByRole('alert')).toHaveTextContent(FALLBACK_LABEL);
    expect(screen.queryByText(DETAILS_LABEL)).not.toBeInTheDocument();
  });
});
