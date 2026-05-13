import { render, screen } from '@testing-library/react';
import type { ErrorInfo, ReactElement, ReactNode } from 'react';

import AuthErrorBoundary from '@/modules/user/features/auth/components/auth-error-boundary';

function ThrowingChild({ error }: { error: Error }): ReactElement {
  throw error;
}

function SafeChild(): ReactElement {
  return <div data-testid="auth-error-boundary-safe-child">Safe child</div>;
}

describe('AuthErrorBoundary', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.restoreAllMocks();
  });

  it('delegates caught errors to onError when provided', () => {
    const error = new Error('delegated error');
    const info = { componentStack: '\n    at ThrowingChild' } as React.ErrorInfo;
    const onError = jest.fn();
    const boundary = new AuthErrorBoundary({ children: <SafeChild />, onError });

    boundary.componentDidCatch(error, info);

    expect(onError).toHaveBeenCalledWith(error, info);
  });

  it('does not try to access console in production mode', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('production error');
    const info = { componentStack: '\n    at ThrowingChild' } as ErrorInfo;
    const reflectGetSpy = jest.spyOn(Reflect, 'get');
    const boundary = new AuthErrorBoundary({ children: <SafeChild /> });

    boundary.componentDidCatch(error, info);

    expect(reflectGetSpy).not.toHaveBeenCalled();
  });

  it('logs through the resolved console in non-production mode', () => {
    process.env.NODE_ENV = 'test';
    const error = new Error('logged error');
    const info = { componentStack: '\n    at ThrowingChild' } as ErrorInfo;
    const consoleError = jest.fn();
    jest.spyOn(Reflect, 'get').mockReturnValue({ error: consoleError } as never);
    const boundary = new AuthErrorBoundary({ children: <SafeChild /> });

    boundary.componentDidCatch(error, info);

    expect(consoleError).toHaveBeenCalledWith('AuthErrorBoundary caught an error:', error, info);
  });

  it('does not throw when console is unavailable in non-production mode', () => {
    process.env.NODE_ENV = 'test';
    const error = new Error('missing console');
    const info = { componentStack: '\n    at ThrowingChild' } as ErrorInfo;
    jest.spyOn(Reflect, 'get').mockReturnValue(undefined as never);
    const boundary = new AuthErrorBoundary({ children: <SafeChild /> });

    expect(() => boundary.componentDidCatch(error, info)).not.toThrow();
  });

  it('renders a custom fallback node when provided', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AuthErrorBoundary fallback={<span>Custom fallback node</span>}>
        <ThrowingChild error={new Error('fallback node error')} />
      </AuthErrorBoundary>
    );

    expect(screen.getByText('Custom fallback node')).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it('renders development error details when NODE_ENV is development', () => {
    process.env.NODE_ENV = 'development';
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AuthErrorBoundary>
        <ThrowingChild error={new Error('development details')} />
      </AuthErrorBoundary>
    );

    expect(screen.getByText('Something went wrong. Please try again later.')).toBeInTheDocument();
    expect(screen.getByText('Error Details')).toBeInTheDocument();
    expect(screen.getByText('development details')).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it('supports fallback render functions and wires the reset handler to the try again button', () => {
    const fallbackRenderer = jest.fn(
      ({ error }: { error?: Error; reset: () => void }): ReactElement => (
        <span>{error?.message}</span>
      )
    );
    const error = new Error('resettable error');
    const boundary = new AuthErrorBoundary({
      children: <SafeChild />,
      fallback: fallbackRenderer,
    });
    const setStateSpy = jest
      .spyOn(boundary, 'setState')
      .mockImplementation(() => undefined as never);

    Object.assign(boundary, {
      state: { hasError: true, error },
    });

    boundary.render() as ReactElement<{ children: ReactNode }>;

    expect(fallbackRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        error,
        reset: expect.any(Function),
      })
    );

    const reset = fallbackRenderer.mock.calls[0]?.[0]?.reset as (() => void) | undefined;

    reset?.();

    expect(setStateSpy).toHaveBeenCalledWith({ hasError: false, error: undefined });
  });
});
