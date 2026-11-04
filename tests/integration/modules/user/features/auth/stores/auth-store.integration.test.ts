import { http, HttpResponse } from 'msw';

import '../../../../../setup';
import container from '@/config/dependency-injection-config';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import type RegistrationAPI from '@auth/repositories/registration-api';
import { useAuthStore, AuthStoreSelectors, authActions } from '@auth/stores';
import {
  buildClientMutationId,
  buildCredentials,
  buildGraphqlUser,
  buildRegistrationResponse,
  buildPendingSessionId,
  buildToken,
  buildUser,
} from '@tests/builders';
import { resetClientStores } from '@tests/utils/reset-client-stores';
import { PRELOADED_AUTH_TOKEN_WINDOW_KEY } from '@tests/utils/seed-preloaded-auth-token';

import server, { GRAPHQL_URL } from '../../../../../mocks/server';

const registrationCredentials = buildUser();

const createUserSuccessBody = {
  data: {
    createUser: {
      user: buildGraphqlUser(),
      clientMutationId: buildClientMutationId(),
    },
  },
};

function createDelayedPromise(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe('Auth Store Integration', () => {
  beforeEach(() => {
    resetClientStores();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    authActions.reset();
    server.resetHandlers();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();

      expect(state.email).toBe('');
      expect(state.token).toBeNull();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeNull();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeNull();
    });
  });

  describe('logout action', () => {
    it('should clear all auth state on logout', async () => {
      const credentials = buildCredentials();
      const token = buildToken();
      useAuthStore.setState({
        email: credentials.email,
        token,
        twoFactorStatus: 'enabled',
        pendingSessionId: buildPendingSessionId(),
        recoveryCodesRemaining: 2,
      });

      authActions.logout();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.email).toBe('');
      expect(state.loginError).toBeNull();
      expect(state.loginLoading).toBe(false);
      expect(state.registerError).toBeNull();
      expect(state.registerLoading).toBe(false);
      expect(state.twoFactorStatus).toBe('unknown');
      expect(state.pendingSessionId).toBeNull();
      expect(state.recoveryCodesRemaining).toBeNull();
    });
  });

  describe('registerUser', () => {
    it('should handle successful registration', async () => {
      server.use(http.post(GRAPHQL_URL, () => HttpResponse.json(createUserSuccessBody)));

      await authActions.registerUser(registrationCredentials);

      const state = useAuthStore.getState();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeNull();
    });

    it('should set loading state during registration', async () => {
      server.use(
        http.post(GRAPHQL_URL, async () => {
          await createDelayedPromise(50);
          return HttpResponse.json(createUserSuccessBody);
        })
      );

      const promise = authActions.registerUser(registrationCredentials);
      expect(useAuthStore.getState().registerLoading).toBe(true);

      await promise;
      expect(useAuthStore.getState().registerLoading).toBe(false);

      const state = useAuthStore.getState();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeNull();
    });

    it('should handle validation error from API response', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      server.use(
        http.post(GRAPHQL_URL, () =>
          HttpResponse.json({
            data: {
              createUser: { user: { id: 'u', confirmed: true, email: 456, initials: 123 } },
            },
          })
        )
      );

      await authActions.registerUser(registrationCredentials);

      expect(consoleError).toHaveBeenCalledTimes(1);
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('https://go.apollo.dev/c/err')
      );

      const state = useAuthStore.getState();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeTruthy();
    });

    it('surfaces a register error when the payload contains no user', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      server.use(
        http.post(GRAPHQL_URL, () => HttpResponse.json({ data: { createUser: { user: null } } }))
      );

      await authActions.registerUser(registrationCredentials);

      expect(consoleError).toHaveBeenCalledTimes(2);
      expect(consoleError).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('https://go.apollo.dev/c/err')
      );
      expect(consoleError).toHaveBeenNthCalledWith(2, 'Registration response validation failed', {
        issueCount: 1,
      });

      const state = useAuthStore.getState();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeTruthy();
    });

    it('should handle 400 error', async () => {
      server.use(
        http.post(GRAPHQL_URL, () =>
          HttpResponse.json({ errors: [{ message: 'Bad request' }] }, { status: 400 })
        )
      );

      await authActions.registerUser(registrationCredentials);

      const state = useAuthStore.getState();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeTruthy();
    });

    it('should handle 409 conflict error', async () => {
      server.use(
        http.post(GRAPHQL_URL, () =>
          HttpResponse.json({ errors: [{ message: 'User already exists' }] }, { status: 409 })
        )
      );

      await authActions.registerUser(registrationCredentials);

      const state = useAuthStore.getState();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeTruthy();
    });

    it('should handle network failure', async () => {
      server.use(http.post(GRAPHQL_URL, () => HttpResponse.error()));

      await authActions.registerUser(registrationCredentials);

      const state = useAuthStore.getState();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeTruthy();
    });

    it('should handle non-API errors from RegistrationAPI', async () => {
      const registrationAPI = container.resolve<RegistrationAPI>(AUTH_TOKENS.RegistrationAPI);
      jest.spyOn(registrationAPI, 'register').mockRejectedValue(new Error('Unexpected failure'));

      await authActions.registerUser(registrationCredentials);

      const state = useAuthStore.getState();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeTruthy();
    });

    it('should handle pre-aborted signal', async () => {
      const abortController = new AbortController();
      abortController.abort();
      server.use(
        http.post(GRAPHQL_URL, () =>
          HttpResponse.json({ errors: [{ message: 'should not surface' }] }, { status: 500 })
        )
      );

      await authActions.registerUser(registrationCredentials, abortController.signal);

      const state = useAuthStore.getState();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeNull();
    });
  });

  describe('selectors', () => {
    it('should select state values correctly', async () => {
      const credentials = buildCredentials();
      const token = buildToken();
      useAuthStore.setState({ email: credentials.email, token });

      const state = useAuthStore.getState();
      expect(AuthStoreSelectors.email(state)).toBe(credentials.email);
      expect(AuthStoreSelectors.token(state)).toBe(token);
      expect(AuthStoreSelectors.loginLoading(state)).toBe(false);
      expect(AuthStoreSelectors.loginError(state)).toBeNull();
      expect(AuthStoreSelectors.registerLoading(state)).toBe(false);
      expect(AuthStoreSelectors.registerError(state)).toBeNull();
      expect(AuthStoreSelectors.isAuthenticated(state)).toBe(true);

      authActions.logout();
      const loggedOut = useAuthStore.getState();
      expect(AuthStoreSelectors.isAuthenticated(loggedOut)).toBe(false);
    });

    it('should select registerUser from state', async () => {
      const user = buildRegistrationResponse();
      useAuthStore.setState({ user });

      const state = useAuthStore.getState();
      expect(AuthStoreSelectors.registerUser(state)).toEqual(user);

      useAuthStore.setState({ user: null });
      expect(AuthStoreSelectors.registerUser(useAuthStore.getState())).toBeNull();
    });
  });

  describe('real integration with DI container', () => {
    it('should use real RegistrationAPI from DI container', async () => {
      const registrationAPI = container.resolve<RegistrationAPI>(AUTH_TOKENS.RegistrationAPI);
      expect(registrationAPI).toBeDefined();

      server.use(http.post(GRAPHQL_URL, () => HttpResponse.json(createUserSuccessBody)));

      await authActions.registerUser(registrationCredentials);

      const state = useAuthStore.getState();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeNull();
    });

    it('resetRegistration clears registration fields; retryable selector reads it', async () => {
      useAuthStore.setState({
        token: 'keep-me',
        email: 'keep@me.com',
        user: { fullName: 'X', email: 'x@y.com' },
        registerError: { kind: 'unknown', displayMessage: 'oops', retryable: true },
        registerLoading: true,
      });

      expect(AuthStoreSelectors.registerRetryable(useAuthStore.getState())).toBe(true);

      authActions.resetRegistration();

      const state = useAuthStore.getState();
      expect(state.token).toBe('keep-me');
      expect(state.email).toBe('keep@me.com');
      expect(state.user).toBeNull();
      expect(state.registerError).toBeNull();
      expect(state.registerLoading).toBe(false);
      expect(AuthStoreSelectors.registerRetryable(state)).toBeUndefined();
    });

    it('seeds token from preloaded auth when the store module is re-evaluated', async () => {
      const token = buildToken();
      const originalEnv = process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN;
      process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN = token;

      try {
        await jest.isolateModulesAsync(async () => {
          const mod = await import('@auth/stores');
          expect(mod.useAuthStore.getState().token).toBe(token);
        });
      } finally {
        if (originalEnv === undefined) {
          delete process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN;
        } else {
          process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN = originalEnv;
        }
      }
    });

    it('seeds token from window when window token is present', async () => {
      const token = buildToken();

      await jest.isolateModulesAsync(async () => {
        window[PRELOADED_AUTH_TOKEN_WINDOW_KEY] = token;
        try {
          const mod = await import('@auth/stores');
          expect(mod.useAuthStore.getState().token).toBe(token);
        } finally {
          delete window[PRELOADED_AUTH_TOKEN_WINDOW_KEY];
        }
      });
    });

    it('trims whitespace from env token', async () => {
      const token = buildToken();
      const originalEnv = process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN;
      process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN = `  ${token}  `;

      try {
        await jest.isolateModulesAsync(async () => {
          const mod = await import('@auth/stores');
          expect(mod.useAuthStore.getState().token).toBe(token);
        });
      } finally {
        if (originalEnv === undefined) {
          delete process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN;
        } else {
          process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN = originalEnv;
        }
      }
    });

    // The singleton behind the @auth/stores barrel — not a hand-built instance — is what
    // ProtectedRoute actually reads, so the production gate has to hold on this path too.
    it('leaves the re-evaluated store unauthenticated in a production build', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      const originalEnv = process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN;
      process.env.NODE_ENV = 'production';
      process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN = buildToken();
      window[PRELOADED_AUTH_TOKEN_WINDOW_KEY] = buildToken();

      try {
        await jest.isolateModulesAsync(async () => {
          const mod = await import('@auth/stores');

          expect(mod.useAuthStore.getState().token).toBeNull();
          expect(AuthStoreSelectors.isAuthenticated(mod.useAuthStore.getState())).toBe(false);
        });
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
        delete window[PRELOADED_AUTH_TOKEN_WINDOW_KEY];
        if (originalEnv === undefined) {
          delete process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN;
        } else {
          process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN = originalEnv;
        }
      }
    });
  });
});
