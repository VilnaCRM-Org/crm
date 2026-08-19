import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { JSX } from 'react';

import AppErrorBoundary from '@/components/error-boundary/app-error-boundary';
import type { ErrorReporter } from '@/services/types/error-reporting';

const REPORT_FAILURE_PREFIX = '[AppErrorBoundary:report]';

function Bomb(): JSX.Element {
  throw new Error('bomb');
}

describe('AppErrorBoundary reporting failures', () => {
  let logged: unknown[][];

  beforeEach(() => {
    logged = [];
    jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      logged.push(args);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs the reporting failure under its own prefix and keeps the fallback up', () => {
    const reportingError = new Error('reporter exploded');
    const reporter: ErrorReporter = {
      report: jest.fn(() => {
        throw reportingError;
      }),
    };

    render(
      <AppErrorBoundary reporter={reporter}>
        <Bomb />
      </AppErrorBoundary>
    );

    expect(logged).toContainEqual([REPORT_FAILURE_PREFIX, reportingError]);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('logs no reporting-failure entry when the reporter succeeds', () => {
    const reporter: ErrorReporter = { report: jest.fn() };

    render(
      <AppErrorBoundary reporter={reporter}>
        <Bomb />
      </AppErrorBoundary>
    );

    expect(reporter.report).toHaveBeenCalledTimes(1);
    expect(logged.some((args) => args[0] === REPORT_FAILURE_PREFIX)).toBe(false);
  });
});
