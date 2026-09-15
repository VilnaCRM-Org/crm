import { faker } from '@faker-js/faker';
import { screen } from '@testing-library/react';
import type { JSX } from 'react';

import AuthErrorBoundary from '@auth/components/auth-error-boundary';
import authErrorReporter from '@auth/utils/auth-error-reporter';
import renderWithProviders from '@tests/unit/utils/render-with-providers';

const TITLE = 'Something went wrong';
const LEGACY_CONSOLE_PREFIX = 'AuthErrorBoundary caught an error:';

function Bomb({ error }: { error: Error }): JSX.Element {
  throw error;
}

function renderThrowing(
  error: Error,
  onError?: jest.Mock
): { onCaughtError: jest.Mock; consoleError: jest.SpyInstance } {
  const onCaughtError = jest.fn();
  const consoleError = jest.spyOn(console, 'error');

  renderWithProviders(
    <AuthErrorBoundary onError={onError}>
      <Bomb error={error} />
    </AuthErrorBoundary>,
    { onCaughtError }
  );

  return { onCaughtError, consoleError };
}

describe('AuthErrorBoundary reporting', () => {
  let report: jest.SpyInstance;

  beforeEach(() => {
    report = jest.spyOn(authErrorReporter, 'report').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reports the caught error to the auth reporter with the component stack and surface', () => {
    const error = new Error(faker.lorem.words(3));

    const { onCaughtError } = renderThrowing(error);

    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith(error, {
      componentStack: expect.any(String),
      surface: 'auth',
    });
    expect(onCaughtError).toHaveBeenCalledTimes(1);
    expect(onCaughtError).toHaveBeenCalledWith(error, expect.anything());
  });

  it('delegates to onError with the error and the component stack', () => {
    const error = new Error(faker.lorem.words(3));
    const onError = jest.fn();

    const { onCaughtError } = renderThrowing(error, onError);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ componentStack: expect.any(String) })
    );
    expect(onCaughtError).toHaveBeenCalledTimes(1);
  });

  it('keeps the fallback up when the reporter throws', () => {
    report.mockImplementation(() => {
      throw new Error('capture failed');
    });

    const { onCaughtError } = renderThrowing(new Error(faker.lorem.word()));

    expect(report).toHaveBeenCalledTimes(1);
    expect(onCaughtError).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { level: 1, name: TITLE })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('never writes the caught error to the console itself', () => {
    const { consoleError, onCaughtError } = renderThrowing(new Error(faker.lorem.word()));

    expect(onCaughtError).toHaveBeenCalledTimes(1);
    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalledWith(
      LEGACY_CONSOLE_PREFIX,
      expect.anything(),
      expect.anything()
    );
  });

  it('does not report or call onError while the children render cleanly', () => {
    const onError = jest.fn();

    renderWithProviders(
      <AuthErrorBoundary onError={onError}>
        <p>fine</p>
      </AuthErrorBoundary>
    );

    expect(screen.getByText('fine')).toBeInTheDocument();
    expect(report).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});
