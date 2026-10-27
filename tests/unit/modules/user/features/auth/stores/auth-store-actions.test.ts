import { createStore } from 'zustand';

import type { ObservabilityService } from '@/services/types/observability/observability';
import AuthStoreActions from '@auth/stores/auth-store-actions';
import useAuthStore, { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import type { AuthError } from '@auth/types/auth-error';
import type { AuthRepository } from '@auth/types/auth-repository';
import type { AuthState } from '@auth/types/auth-store';
import type AuthErrorHandler from '@auth/utils/auth-error-handler';
import AuthRequestErrors from '@auth/utils/auth-request-errors';
import AuthSecuritySignals from '@auth/utils/auth-security-signals';
import { buildEmail, buildFullName, buildPassword, buildToken } from '@tests/builders';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const email = buildEmail();
const token = buildToken();
const password = buildPassword();
const fullName = buildFullName();

const authRequestErrors = new AuthRequestErrors({
  handle: (e: unknown) => ({ displayMessage: String(e), retryable: false }),
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

const makeRepo = (over: Partial<AuthRepository> = {}): AuthRepository =>
  ({
    login: jest.fn().mockResolvedValue({ ok: true, value: { email, token } }),
    register: jest.fn().mockResolvedValue({ ok: true, value: { email } }),
    ...over,
  }) as AuthRepository;

const registerWith = (over: Partial<AuthRepository>): Promise<void> =>
  new AuthStoreActions({
    repository: makeRepo(over),
    authRequestErrors,
    authState: useAuthStore,
    securitySignals,
  }).register({
    fullName,
    email,
    password,
  });

const abortError = {
  kind: 'network' as const,
  displayMessage: '',
  retryable: false,
  aborted: true,
};

describe('AuthStoreActions', () => {
  beforeEach(() => resetClientStores());

  it('writes state through the injected auth store, not the module singleton', async () => {
    const injectedState = createStore<AuthState>()(() => ({ ...CLEARED_AUTH_STATE }));

    await new AuthStoreActions({
      repository: makeRepo(),
      authRequestErrors,
      authState: injectedState,
      securitySignals,
    }).register({ fullName, email, password });

    expect(injectedState.getState()).toMatchObject({ registerLoading: false, user: { email } });
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('sets the user on successful registration', async () => {
    await registerWith({});
    expect(useAuthStore.getState()).toMatchObject({
      registerLoading: false,
      user: { email },
      registerError: null,
    });
  });

  it('stores a structured error returned by the register repository', async () => {
    const error: AuthError = { kind: 'conflict', displayMessage: 'Exists', retryable: false };
    await registerWith({ register: jest.fn().mockResolvedValue({ ok: false, error }) });
    expect(useAuthStore.getState()).toMatchObject({ registerLoading: false, registerError: error });
  });

  it('keeps register error null when the repository reports an abort', async () => {
    await registerWith({ register: jest.fn().mockResolvedValue({ ok: false, error: abortError }) });
    expect(useAuthStore.getState()).toMatchObject({ registerLoading: false, registerError: null });
  });

  it('normalizes a generic thrown register error to an unknown auth error', async () => {
    await registerWith({ register: jest.fn().mockRejectedValue(new Error('Unexpected failure')) });
    expect(useAuthStore.getState().registerError).toMatchObject({
      kind: 'unknown',
      retryable: false,
    });
  });

  it('treats a thrown abort-marker register rejection as aborted', async () => {
    await registerWith({ register: jest.fn().mockRejectedValue({ aborted: true }) });
    expect(useAuthStore.getState()).toMatchObject({ registerLoading: false, registerError: null });
  });

  describe('security-event instrumentation (#159)', () => {
    const invalidCredentials: AuthError = {
      kind: 'authentication',
      displayMessage: 'Invalid credentials',
      retryable: false,
    };

    it('emits a registration auth_failure for a rejected registration result', async () => {
      await registerWith({
        register: jest
          .fn()
          .mockResolvedValue({ ok: false, error: { ...invalidCredentials, kind: 'conflict' } }),
      });

      expect(recorder.authFailure).toHaveBeenCalledWith('registration', 'conflict');
    });

    it('emits a registration auth_failure on a register throw', async () => {
      await registerWith({ register: jest.fn().mockRejectedValue(invalidCredentials) });

      expect(recorder.authFailure).toHaveBeenCalledWith('registration', 'authentication');
    });

    it('stays silent on an aborted registration attempt', async () => {
      await registerWith({
        register: jest.fn().mockResolvedValue({ ok: false, error: abortError }),
      });
      await registerWith({ register: jest.fn().mockRejectedValue({ aborted: true }) });

      expect(recorder.authFailure).not.toHaveBeenCalled();
    });
  });
});
