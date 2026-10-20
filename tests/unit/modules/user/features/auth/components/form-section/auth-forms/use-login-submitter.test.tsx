import { act, renderHook } from '@testing-library/react';
import type { TFunction } from 'i18next';
import * as React from 'react';

import useLoginSubmitter from '@auth/components/form-section/auth-forms/use-login-submitter';
import { useAuthStore, authActions } from '@auth/stores';
import type { AuthErrorKind } from '@auth/types/auth-error';
import { buildCredentials } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';
import { resetClientStores } from '@tests/utils/reset-client-stores';

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
    ['authentication', undefined, 'sign_in.errors.invalid_credentials'],
    ['network', undefined, 'failure_responses.network_errors.network_error'],
    ['server', undefined, 'failure_responses.server_errors.server_error'],
    ['validation', undefined, 'failure_responses.client_errors.something_went_wrong'],
    ['conflict', undefined, 'failure_responses.client_errors.unexpected_error'],
    ['unknown', undefined, 'failure_responses.client_errors.unexpected_error'],
    ['server', 429, 'sign_in.errors.rate_limited'],
    ['server', 503, 'failure_responses.server_errors.server_error'],
  ] as const)('maps a %s failure (status %p) to %s', (kind, status, key) => {
    useAuthStore.setState({
      loginError: {
        kind,
        displayMessage: 'Raw backend text',
        retryable: false,
        ...(status === undefined ? {} : { status }),
      },
    });

    const { result } = renderHook(() => useLoginSubmitter(t));

    expect(result.current.error).toBe(key);
    expect(result.current.error).not.toContain('Raw backend text');
  });

  it('maps every failure to its key when the module loads inside the test', async () => {
    const fresh = await loadIsolated(async () => {
      jest.doMock('react', () => React);
      return {
        hook: (await import('@auth/components/form-section/auth-forms/use-login-submitter'))
          .default,
        store: (await import('@auth/stores')).useAuthStore,
      };
    });
    const errorFor = (kind: AuthErrorKind, status?: number): string => {
      fresh.store.setState({
        loginError: {
          kind,
          displayMessage: 'Raw backend text',
          retryable: false,
          ...(status === undefined ? {} : { status }),
        },
      });
      const { result, unmount } = renderHook(() => fresh.hook(t));
      const shown = result.current.error;
      unmount();
      return shown;
    };

    expect(errorFor('authentication')).toBe('sign_in.errors.invalid_credentials');
    expect(errorFor('network')).toBe('failure_responses.network_errors.network_error');
    expect(errorFor('server')).toBe('failure_responses.server_errors.server_error');
    expect(errorFor('validation')).toBe('failure_responses.client_errors.something_went_wrong');
    expect(errorFor('unknown')).toBe('failure_responses.client_errors.unexpected_error');
    expect(errorFor('server', 429)).toBe('sign_in.errors.rate_limited');
  });

  it('retries with the values submitted last', async () => {
    const loginUser = jest.spyOn(authActions, 'loginUser').mockResolvedValue(undefined);
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

    expect(loginUser).toHaveBeenCalledTimes(3);
    expect(loginUser).toHaveBeenLastCalledWith(second, expect.any(AbortSignal));
    expect(loginUser.mock.contexts[2]).toBe(authActions);
  });

  it('does nothing on retry before any submit', () => {
    const loginUser = jest.spyOn(authActions, 'loginUser').mockResolvedValue(undefined);
    const { result } = renderHook(() => useLoginSubmitter(t));

    act(() => result.current.handleRetry());

    expect(loginUser).not.toHaveBeenCalled();
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

  it('invokes the loginUser action when handleLogin is called', async () => {
    const loginUser = jest.spyOn(authActions, 'loginUser').mockResolvedValue(undefined);
    const credentials = buildCredentials();

    const { result } = renderHook(() => useLoginSubmitter(t));

    await act(async () => {
      await result.current.handleLogin(credentials);
    });

    expect(loginUser).toHaveBeenCalledWith(credentials, expect.any(AbortSignal));
  });

  it('calls loginUser on the store singleton so the deferred root keeps its receiver', async () => {
    const loginUser = jest.spyOn(authActions, 'loginUser').mockResolvedValue(undefined);

    const { result } = renderHook(() => useLoginSubmitter(t));

    await act(async () => {
      await result.current.handleLogin(buildCredentials());
    });

    expect(loginUser.mock.contexts).toHaveLength(1);
    expect(loginUser.mock.contexts[0]).toBe(authActions);
  });

  it('does not restore a late login error after unmount', async () => {
    const deferred = createDeferred();
    const lateError = {
      kind: 'authentication' as const,
      displayMessage: 'late failure',
      retryable: false,
    };
    jest
      .spyOn(authActions, 'loginUser')
      .mockImplementation(async (_data, signal?: AbortSignal): Promise<void> => {
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
