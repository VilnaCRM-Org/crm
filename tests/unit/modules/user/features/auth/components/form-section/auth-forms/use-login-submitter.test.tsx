import { act, renderHook } from '@testing-library/react';
import type { TFunction } from 'i18next';
import * as React from 'react';

import useLoginSubmitter from '@auth/components/form-section/auth-forms/use-login-submitter';
import { useAuthStore } from '@auth/stores';
import type { SignInFailureReason } from '@auth/types/two-factor/sign-in-failure';
import { buildCredentials } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const mockRun = jest.fn();

jest.mock('@auth/hooks/use-sign-in-submit', () => ({
  __esModule: true,
  default: (): jest.Mock => mockRun,
}));

const t: TFunction = ((key: string, options?: Record<string, unknown>): string => {
  if (options?.reason !== undefined) return `${key}|${String(options.reason)}`;
  return key;
}) as unknown as TFunction;

function createDeferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve = (): void => {};
  const promise = new Promise<void>((resolver) => {
    resolve = resolver;
  });

  return { promise, resolve };
}

describe('useLoginSubmitter', () => {
  beforeEach(() => {
    resetClientStores();
    mockRun.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns empty error when store has none and exposes loading state', () => {
    const { result } = renderHook(() => useLoginSubmitter(t));

    expect(result.current.error).toBe('');
    expect(result.current.isSubmitting).toBe(false);
  });

  it.each([
    ['invalid_credentials', 'authentication', false, 'sign_in.errors.invalid_credentials'],
    ['locked', 'authentication', false, 'sign_in.errors.locked'],
    ['rate_limited', 'server', false, 'sign_in.errors.rate_limited'],
    ['transient', 'network', true, 'sign_in.errors.transient'],
    ['transient', 'server', true, 'sign_in.errors.transient'],
  ] as const)(
    'maps the %s reason of a %s failure (retryable %s) to %s',
    (reason, kind, retryable, key) => {
      useAuthStore.setState({
        loginError: { kind, displayMessage: 'Raw backend text', retryable, reason },
      });

      const { result } = renderHook(() => useLoginSubmitter(t));

      expect(result.current.error).toBe(key);
      expect(result.current.error).not.toContain('Raw backend text');
      expect(result.current.retryable).toBe(retryable);
    }
  );

  it('treats a failure without a reason as transient and retryable', () => {
    useAuthStore.setState({
      loginError: { kind: 'network', displayMessage: 'Raw backend text', retryable: true },
    });

    const { result } = renderHook(() => useLoginSubmitter(t));

    expect(result.current.error).toBe('sign_in.errors.transient');
    expect(result.current.retryable).toBe(true);
  });

  it('offers no retry and no message when nothing failed', () => {
    const { result } = renderHook(() => useLoginSubmitter(t));

    expect(result.current.error).toBe('');
    expect(result.current.retryable).toBe(false);
  });

  it('maps every reason to its key when the module loads inside the test', async () => {
    const fresh = await loadIsolated(async () => {
      jest.doMock('react', () => React);
      return {
        hook: (await import('@auth/components/form-section/auth-forms/use-login-submitter'))
          .default,
        store: (await import('@auth/stores')).useAuthStore,
      };
    });
    const errorFor = (reason: SignInFailureReason): string => {
      fresh.store.setState({
        loginError: {
          kind: 'authentication',
          displayMessage: 'Raw backend text',
          retryable: false,
          reason,
        },
      });
      const { result, unmount } = renderHook(() => fresh.hook(t));
      const shown = result.current.error;
      unmount();
      return shown;
    };

    expect(errorFor('invalid_credentials')).toBe('sign_in.errors.invalid_credentials');
    expect(errorFor('locked')).toBe('sign_in.errors.locked');
    expect(errorFor('rate_limited')).toBe('sign_in.errors.rate_limited');
    expect(errorFor('transient')).toBe('sign_in.errors.transient');
  });

  it('retries with the values submitted last', async () => {
    mockRun.mockResolvedValue(undefined);
    const first = buildCredentials();
    const second = buildCredentials();
    const { result } = renderHook(() => useLoginSubmitter(t));

    await act(async () => {
      await result.current.handleLogin(first);
      await result.current.handleLogin(second);
    });
    await act(async () => {
      result.current.handleRetry();
    });

    expect(mockRun).toHaveBeenCalledTimes(3);
    expect(mockRun).toHaveBeenLastCalledWith(second, expect.any(AbortSignal));
  });

  it('does nothing on retry before any submit', () => {
    mockRun.mockResolvedValue(undefined);
    const { result } = renderHook(() => useLoginSubmitter(t));

    act(() => result.current.handleRetry());

    expect(mockRun).not.toHaveBeenCalled();
  });

  it('clears the shown error on back', () => {
    useAuthStore.setState({
      loginError: { kind: 'network', displayMessage: 'offline', retryable: true },
    });
    const { result } = renderHook(() => useLoginSubmitter(t));

    act(() => result.current.handleBack());

    expect(useAuthStore.getState().loginError).toBeNull();
    expect(result.current.error).toBe('');
  });

  it('clears the login error on unmount', () => {
    useAuthStore.setState({
      loginError: { kind: 'authentication', displayMessage: 'still here', retryable: false },
    });

    const { unmount } = renderHook(() => useLoginSubmitter(t));
    unmount();

    expect(useAuthStore.getState().loginError).toBeNull();
  });

  it('hands the credentials and a signal to the sign-in run on handleLogin', async () => {
    mockRun.mockResolvedValue(undefined);
    const credentials = buildCredentials();

    const { result } = renderHook(() => useLoginSubmitter(t));

    await act(async () => {
      await result.current.handleLogin(credentials);
    });

    expect(mockRun).toHaveBeenCalledWith(credentials, expect.any(AbortSignal));
  });

  it('does not restore a late login error after unmount', async () => {
    const deferred = createDeferred();
    const lateError = {
      kind: 'authentication' as const,
      displayMessage: 'late failure',
      retryable: false,
    };
    mockRun.mockImplementation(async (_data, signal?: AbortSignal): Promise<void> => {
      await deferred.promise;

      if (signal?.aborted) {
        return;
      }

      useAuthStore.setState({ loginError: lateError });
    });

    const { result, unmount } = renderHook(() => useLoginSubmitter(t));
    let pendingLogin!: Promise<void>;

    await act(async () => {
      pendingLogin = result.current.handleLogin(buildCredentials());
    });

    unmount();

    await act(async () => {
      deferred.resolve();
      await pendingLogin;
    });

    expect(useAuthStore.getState().loginError).toBeNull();
  });
});
