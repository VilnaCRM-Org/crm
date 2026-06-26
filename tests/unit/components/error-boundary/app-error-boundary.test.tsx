// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';

import AppErrorBoundary from '@/components/error-boundary/app-error-boundary';
import type { ErrorReporter } from '@/services/types/error-reporting';

function Bomb({ shouldThrow = false }: { shouldThrow?: boolean }): JSX.Element {
  if (shouldThrow) throw new Error('bomb');
  return <span>OK</span>;
}

describe('AppErrorBoundary', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('renders children when no error occurs (AC1)', () => {
    render(
      <AppErrorBoundary>
        <Bomb />
      </AppErrorBoundary>
    );

    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('renders ErrorFallback when a child throws (AC1)', () => {
    render(
      <AppErrorBoundary>
        <Bomb shouldThrow />
      </AppErrorBoundary>
    );

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('re-renders children after reset (AC2)', () => {
    let shouldThrow = true;

    function ControlledBomb(): JSX.Element {
      if (shouldThrow) throw new Error('boom');
      return <span>recovered</span>;
    }

    render(
      <AppErrorBoundary>
        <ControlledBomb />
      </AppErrorBoundary>
    );

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.getByText('recovered')).toBeInTheDocument();
  });

  it('calls reporter.report with the error and componentStack (AC3)', () => {
    const mockReporter: ErrorReporter = { report: jest.fn() };
    const error = new Error('boom');

    function BombWithError(): JSX.Element {
      throw error;
    }

    render(
      <AppErrorBoundary reporter={mockReporter}>
        <BombWithError />
      </AppErrorBoundary>
    );

    expect(mockReporter.report).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('logs [AppErrorBoundary] to console in non-production (AR18)', () => {
    const calls: unknown[][] = [];
    consoleSpy.mockImplementation((...args: unknown[]) => {
      calls.push(args);
    });

    render(
      <AppErrorBoundary>
        <Bomb shouldThrow />
      </AppErrorBoundary>
    );

    expect(calls.some((args) => args[0] === '[AppErrorBoundary]')).toBe(true);
  });

  it('does not log [AppErrorBoundary] to console in production (AR18)', () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });

    try {
      const calls: unknown[][] = [];
      consoleSpy.mockImplementation((...args: unknown[]) => {
        calls.push(args);
      });

      render(
        <AppErrorBoundary>
          <Bomb shouldThrow />
        </AppErrorBoundary>
      );

      expect(calls.some((args) => args[0] === '[AppErrorBoundary]')).toBe(false);
    } finally {
      Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, configurable: true });
    }
  });

  it('keeps rendering the fallback when the reporter itself throws (AC3)', () => {
    const throwingReporter: ErrorReporter = {
      report: jest.fn(() => {
        throw new Error('reporter exploded');
      }),
    };

    render(
      <AppErrorBoundary reporter={throwingReporter}>
        <Bomb shouldThrow />
      </AppErrorBoundary>
    );

    expect(throwingReporter.report).toHaveBeenCalled();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
