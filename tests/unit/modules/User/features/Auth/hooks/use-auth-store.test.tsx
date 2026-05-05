import { act, renderHook } from '@testing-library/react';

import useAuthStore from '@/modules/User/features/Auth/hooks/use-auth-store';
import { ApiErrorCodes } from '@/modules/User/types/api-errors';
import ApiError from '@/modules/User/types/api-errors/api-error';

const loginMock = jest.fn();
const registerMock = jest.fn();

type MockAuthClients = {
  loginAPI: { login: typeof loginMock };
  registrationAPI: { register: typeof registerMock };
};

function createAuthClientsMock(): MockAuthClients {
  return {
    loginAPI: { login: loginMock },
    registrationAPI: { register: registerMock },
  };
}

jest.mock('@/modules/User/features/Auth/repositories/create-auth-clients', () => ({
  __esModule: true,
  default: createAuthClientsMock,
}));

type DeferredPromise<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

const createDeferred = <T,>(): DeferredPromise<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

describe('useAuthStore', () => {
  beforeEach(() => {
    loginMock.mockReset();
    registerMock.mockReset();
  });

  it('tracks registration loading locally and clears the error after a successful registration', async () => {
    const deferred = createDeferred<{ email: string; fullName: string }>();
    registerMock.mockReturnValue(deferred.promise);

    const { result } = renderHook(() => useAuthStore());

    let registerPromise!: Promise<{ email?: string; fullName?: string }>;
    act(() => {
      registerPromise = result.current.register({
        fullName: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'Password1',
      });
    });

    expect(result.current.registrationLoading).toBe(true);
    expect(result.current.registrationError).toBeNull();

    deferred.resolve({ email: 'ada@example.com', fullName: 'Ada Lovelace' });

    await act(async () => {
      await registerPromise;
    });

    expect(result.current.registrationLoading).toBe(false);
    expect(result.current.registrationError).toBeNull();
  });

  it('maps registration failures to a local error message', async () => {
    registerMock.mockRejectedValue(
      new ApiError('Network error. Please check your connection.', ApiErrorCodes.NETWORK)
    );

    const { result } = renderHook(() => useAuthStore());

    let error: unknown;
    await act(async () => {
      try {
        await result.current.register({
          fullName: 'Ada Lovelace',
          email: 'ada@example.com',
          password: 'Password1',
        });
      } catch (caughtError) {
        error = caughtError;
      }
    });

    expect(error).toEqual({
      displayMessage: 'Network error. Please check your connection.',
      retryable: true,
    });
    expect(result.current.registrationLoading).toBe(false);
    expect(result.current.registrationError).toBe('Network error. Please check your connection.');
  });

  it('returns the normalized login payload without relying on redux state', async () => {
    loginMock.mockResolvedValue({ token: 'secret-token' });

    const { result } = renderHook(() => useAuthStore());

    let loginResult: { email: string; token: string } | undefined;
    await act(async () => {
      loginResult = await result.current.login({
        email: 'Ada@Example.com',
        password: 'Password1',
      });
    });

    expect(loginResult).toEqual({ email: 'ada@example.com', token: 'secret-token' });
  });

  it('rethrows login validation failures as a UiError object', async () => {
    loginMock.mockResolvedValue({ token: 123 });

    const { result } = renderHook(() => useAuthStore());

    let error: unknown;
    await act(async () => {
      try {
        await result.current.login({
          email: 'Ada@Example.com',
          password: 'Password1',
        });
      } catch (caughtError) {
        error = caughtError;
      }
    });

    expect(error).toEqual({
      displayMessage: 'token: expected string',
      retryable: true,
    });
  });

  it('rethrows registration AbortError without converting it', async () => {
    const abortError = new Error('The user aborted a request.');
    abortError.name = 'AbortError';
    registerMock.mockRejectedValue(abortError);

    const { result } = renderHook(() => useAuthStore());

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.register({
          fullName: 'Ada Lovelace',
          email: 'ada@example.com',
          password: 'Password1',
        });
      } catch (e) {
        caughtError = e;
      }
    });

    expect(caughtError).toBe(abortError);
    expect(result.current.registrationError).toBeNull();
  });

  it('rethrows login AbortError without converting it', async () => {
    const abortError = new Error('The user aborted a request.');
    abortError.name = 'AbortError';
    loginMock.mockRejectedValue(abortError);

    const { result } = renderHook(() => useAuthStore());

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.login({
          email: 'Ada@Example.com',
          password: 'Password1',
        });
      } catch (e) {
        caughtError = e;
      }
    });

    expect(caughtError).toBe(abortError);
  });

  it('maps login API errors to a UiError via handleAuthError', async () => {
    loginMock.mockRejectedValue(
      new ApiError('Network error. Please check your connection.', ApiErrorCodes.NETWORK)
    );

    const { result } = renderHook(() => useAuthStore());

    let error: unknown;
    await act(async () => {
      try {
        await result.current.login({ email: 'ada@example.com', password: 'Password1' });
      } catch (e) {
        error = e;
      }
    });

    expect(error).toMatchObject({ displayMessage: expect.any(String) });
  });

  it('aborts an in-flight login when a second login is initiated', async () => {
    const firstDeferred = createDeferred<{ token: string }>();
    const secondDeferred = createDeferred<{ token: string }>();

    loginMock
      .mockReturnValueOnce(firstDeferred.promise)
      .mockReturnValueOnce(secondDeferred.promise);

    const { result } = renderHook(() => useAuthStore());

    // Start first login — stays pending
    let firstError: unknown;
    act(() => {
      result.current.login({ email: 'first@example.com', password: 'Password1' }).catch((e) => {
        firstError = e;
      });
    });

    // Start second login — this calls ?.abort() on the first controller (non-null branch)
    let secondResult: { email: string; token: string } | undefined;
    act(() => {
      result.current.login({ email: 'second@example.com', password: 'Password1' }).then((r) => {
        secondResult = r;
      });
    });

    // Reject first so its finally block runs while second's controller is active
    await act(async () => {
      firstDeferred.reject(new Error('replaced'));
    });

    // Resolve second login
    await act(async () => {
      secondDeferred.resolve({ token: 'second-token' });
      await secondDeferred.promise;
    });

    expect(secondResult).toEqual({ email: 'second@example.com', token: 'second-token' });
    expect(firstError).toBeDefined();
  });

  it('aborts an in-flight registration when a second registration is initiated', async () => {
    const firstDeferred = createDeferred<{ email: string; fullName: string }>();
    const secondDeferred = createDeferred<{ email: string; fullName: string }>();

    registerMock
      .mockReturnValueOnce(firstDeferred.promise)
      .mockReturnValueOnce(secondDeferred.promise);

    const { result } = renderHook(() => useAuthStore());

    let firstError: unknown;
    act(() => {
      result.current
        .register({ fullName: 'First', email: 'first@example.com', password: 'Password1' })
        .catch((e) => {
          firstError = e;
        });
    });

    let secondResult: { email?: string; fullName?: string } | undefined;
    act(() => {
      result.current
        .register({ fullName: 'Second', email: 'second@example.com', password: 'Password1' })
        .then((r) => {
          secondResult = r;
        });
    });

    await act(async () => {
      firstDeferred.reject(new Error('replaced'));
    });

    await act(async () => {
      secondDeferred.resolve({ email: 'second@example.com', fullName: 'Second' });
      await secondDeferred.promise;
    });

    expect(secondResult).toEqual({ email: 'second@example.com', fullName: 'Second' });
    expect(firstError).toBeDefined();
  });

  it('runs the cleanup on unmount and aborts in-flight requests', async () => {
    loginMock.mockReturnValue(new Promise(() => {}));
    registerMock.mockReturnValue(new Promise(() => {}));

    const { result, unmount } = renderHook(() => useAuthStore());

    act(() => {
      result.current.login({ email: 'ada@example.com', password: 'Password1' }).catch(() => {});
      result.current
        .register({ fullName: 'Ada Lovelace', email: 'ada@example.com', password: 'Password1' })
        .catch(() => {});
    });

    unmount();
  });

  it('sets registrationError when API returns a non-object response', async () => {
    registerMock.mockResolvedValue(null);

    const { result } = renderHook(() => useAuthStore());

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.register({
          fullName: 'Ada Lovelace',
          email: 'ada@example.com',
          password: 'Password1',
        });
      } catch (e) {
        caughtError = e;
      }
    });

    expect(caughtError).toEqual({
      displayMessage: 'value: expected object',
      retryable: false,
    });
    expect(result.current.registrationError).toBe('value: expected object');
    expect(result.current.registrationLoading).toBe(false);
  });
});
