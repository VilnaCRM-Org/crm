import { faker } from '@faker-js/faker';
import { screen } from '@testing-library/react';
import type { JSX } from 'react';

import AuthErrorBoundary from '@auth/components/auth-error-boundary';
import renderWithProviders from '@tests/unit/utils/render-with-providers';

const DETAILS_LABEL = 'Error Details';
const FALLBACK_TEXT = 'Something went wrong. Please try again later.';
const RETRY_LABEL = 'Try again';

function Bomb({ thrown }: { thrown: unknown }): JSX.Element {
  throw thrown;
}

function mountThrowing(thrown: unknown): jest.Mock {
  const onCaughtError = jest.fn();

  renderWithProviders(
    <AuthErrorBoundary>
      <Bomb thrown={thrown} />
    </AuthErrorBoundary>,
    { onCaughtError }
  );

  return onCaughtError;
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
  it.each(['test', 'development'])(
    'shows the failure message with its line breaks preserved under NODE_ENV=%s',
    (nodeEnv) => {
      const failureMessage = `${faker.lorem.sentence()}\n${faker.lorem.sentence()}`;

      withNodeEnv(nodeEnv, () => {
        const onCaughtError = mountThrowing(new Error(failureMessage));

        expect(onCaughtError).toHaveBeenCalledTimes(1);
        expect(screen.getByText(DETAILS_LABEL)).toBeInTheDocument();
        const message = screen.getByText(failureMessage, { normalizer: rawText });
        expect(message.tagName).toBe('PRE');
        expect(message).toHaveStyle({ whiteSpace: 'pre-wrap' });
      });
    }
  );

  it('hides the failure message in production while still offering a retry', () => {
    const failureMessage = faker.lorem.sentence();

    withNodeEnv('production', () => {
      const onCaughtError = mountThrowing(new Error(failureMessage));

      expect(onCaughtError).toHaveBeenCalledTimes(1);
      expect(screen.queryByText(DETAILS_LABEL)).not.toBeInTheDocument();
      expect(screen.queryByText(failureMessage, { normalizer: rawText })).not.toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent(FALLBACK_TEXT);
      expect(screen.getByRole('button', { name: RETRY_LABEL })).toBeInTheDocument();
    });
  });

  it('wraps a thrown non-Error value so the details still show what was thrown', () => {
    const onCaughtError = mountThrowing(undefined);

    expect(onCaughtError).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alert')).toHaveTextContent(FALLBACK_TEXT);
    expect(screen.getByRole('button', { name: RETRY_LABEL })).toBeInTheDocument();
    expect(screen.getByText(DETAILS_LABEL)).toBeInTheDocument();
    expect(screen.getByText('undefined')).toBeInTheDocument();
  });
});
