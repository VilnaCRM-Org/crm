import type { ObservabilityService } from '@/services/types/observability/observability';
import AuthStoreActions from '@auth/stores/auth-store-actions';
import useAuthStore from '@auth/stores/use-auth-store';
import type { AuthError } from '@auth/types/auth-error';
import type { AuthRepository, LoginResult, RegisterResult } from '@auth/types/auth-repository';
import type AuthErrorHandler from '@auth/utils/auth-error-handler';
import AuthRequestErrors from '@auth/utils/auth-request-errors';
import AuthSecuritySignals from '@auth/utils/auth-security-signals';
import {
  buildCredentials,
  buildEmail,
  buildFullName,
  buildToken,
  buildUser,
} from '@tests/builders';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const FALLBACK_MESSAGE = 'Handled by the auth error handler';

const credentials = buildCredentials();
const registration = buildUser();
const email = buildEmail();
const fullName = buildFullName();
const token = buildToken();

const NORMALIZED: AuthError = {
  kind: 'unknown',
  displayMessage: FALLBACK_MESSAGE,
  retryable: true,
};

const authRequestErrors = new AuthRequestErrors({
  handle: () => ({ displayMessage: FALLBACK_MESSAGE, retryable: true }),
} as unknown as AuthErrorHandler);

const observability = {
  init: jest.fn(),
  captureError: jest.fn(),
  setUser: jest.fn(),
  clearUser: jest.fn(),
  reportVital: jest.fn(),
} as unknown as ObservabilityService;

const recorder = {
  authFailure: jest.fn(),
  unauthorizedResponse: jest.fn(),
  boundaryCatch: jest.fn(),
};

const securitySignals = new AuthSecuritySignals(recorder, observability);

interface Deferred<T> {
  promise: Promise<T>;
  settle: (value: T) => void;
}

const defer = <T>(): Deferred<T> => {
  let settle: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolve) => {
    settle = resolve;
  });
  return { promise, settle };
};

const makeActions = (over: Partial<AuthRepository>): AuthStoreActions =>
  new AuthStoreActions({
    repository: {
      login: jest.fn().mockResolvedValue({ ok: true, value: { email, token } }),
      register: jest.fn().mockResolvedValue({ ok: true, value: { email, fullName } }),
      ...over,
    } as unknown as AuthRepository,
    authRequestErrors,
    authState: useAuthStore,
    securitySignals,
  });

const rejectLogin = (error: unknown): Promise<void> =>
  makeActions({ login: jest.fn().mockRejectedValue(error) }).login(credentials);

const rejectRegister = (error: unknown): Promise<void> =>
  makeActions({ register: jest.fn().mockRejectedValue(error) }).register(registration);

const staleLoginError: AuthError = { kind: 'server', displayMessage: 'stale', retryable: false };

describe('AuthStoreActions in-flight state', () => {
  beforeEach(() => resetClientStores());
  afterEach(() => resetClientStores());

  it('flags login as loading and clears the previous error before awaiting', async () => {
    useAuthStore.setState({ loginLoading: false, loginError: staleLoginError });
    const deferred = defer<LoginResult>();

    const pending = makeActions({
      login: jest.fn().mockReturnValue(deferred.promise),
    }).login(credentials);

    expect(useAuthStore.getState().loginLoading).toBe(true);
    expect(useAuthStore.getState().loginError).toBeNull();

    deferred.settle({ ok: true, value: { email, token } });
    await pending;

    expect(useAuthStore.getState()).toMatchObject({ loginLoading: false, token, email });
  });

  it('flags registration as loading and clears the previous error and user', async () => {
    useAuthStore.setState({
      registerLoading: false,
      registerError: staleLoginError,
      user: { email, fullName },
    });
    const deferred = defer<RegisterResult>();

    const pending = makeActions({
      register: jest.fn().mockReturnValue(deferred.promise),
    }).register(registration);

    expect(useAuthStore.getState().registerLoading).toBe(true);
    expect(useAuthStore.getState().registerError).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();

    deferred.settle({ ok: true, value: { email, fullName } });
    await pending;

    expect(useAuthStore.getState()).toMatchObject({
      registerLoading: false,
      user: { email, fullName },
    });
  });

  it('lands registration back on a settled, not-loading state after a rejection', async () => {
    await rejectRegister(new Error('boom'));

    expect(useAuthStore.getState().registerLoading).toBe(false);
    expect(useAuthStore.getState().registerError).toEqual(NORMALIZED);
  });
});

describe('AuthStoreActions auth-error recognition', () => {
  beforeEach(() => resetClientStores());
  afterEach(() => resetClientStores());

  it('passes a fully shaped auth error through untouched', async () => {
    const error: AuthError = { kind: 'validation', displayMessage: 'Bad input', retryable: false };

    await rejectLogin(error);

    expect(useAuthStore.getState().loginError).toEqual(error);
  });

  it.each([
    [
      'kind is not a string',
      { kind: 42, displayMessage: 'Bad input', retryable: false },
      { kind: 'unknown', displayMessage: 'Bad input', retryable: false },
    ],
    [
      'displayMessage is not a string',
      { kind: 'network', displayMessage: null, retryable: false },
      NORMALIZED,
    ],
    [
      'retryable is not a boolean',
      { kind: 'network', displayMessage: 'Bad input', retryable: 'no' },
      NORMALIZED,
    ],
  ])('rewrites the kind of a rejection whose %s', async (_label, error, expected) => {
    await rejectLogin(error);

    expect(useAuthStore.getState().loginError).toEqual(expected);
  });

  it('normalizes a null rejection without dereferencing it', async () => {
    await expect(rejectLogin(null)).resolves.toBeUndefined();

    expect(useAuthStore.getState().loginError).toEqual(NORMALIZED);
  });

  it('normalizes a callable rejection even when it carries the auth-error shape', async () => {
    const callable = Object.assign(() => undefined, {
      kind: 'validation',
      displayMessage: 'Bad input',
      retryable: false,
    });

    await rejectLogin(callable);

    expect(useAuthStore.getState().loginError).toEqual(NORMALIZED);
  });
});

describe('AuthStoreActions abort recognition', () => {
  beforeEach(() => resetClientStores());
  afterEach(() => resetClientStores());

  it('does not treat an aborted flag on a callable rejection as an abort', async () => {
    const callable = Object.assign(() => undefined, { aborted: true });

    await rejectLogin(callable);

    expect(useAuthStore.getState().loginError).toEqual(NORMALIZED);
    expect(useAuthStore.getState().loginLoading).toBe(false);
  });

  it('does not treat a falsy aborted marker as an abort', async () => {
    await rejectLogin({ aborted: false, reason: 'declined' });

    expect(useAuthStore.getState().loginError).toEqual(NORMALIZED);
  });

  it('still treats a truthy aborted marker object as an abort', async () => {
    await rejectLogin({ aborted: true });

    expect(useAuthStore.getState()).toMatchObject({ loginLoading: false, loginError: null });
  });
});
