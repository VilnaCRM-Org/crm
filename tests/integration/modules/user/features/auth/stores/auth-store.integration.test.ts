import { rest } from 'msw';

import '../../../../../setup';
import API_ENDPOINTS from '@/config/api-config';
import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import type LoginAPI from '@auth/repositories/login-api';
import type RegistrationAPI from '@auth/repositories/registration-api';
import { AuthStateVar, AuthStoreSelectors, authActions } from '@auth/stores';
import {
  buildClientMutationId,
  buildCredentials,
  buildGraphqlUser,
  buildLoginResponse,
  buildRegistrationResponse,
  buildToken,
  buildUser,
} from '@tests/builders';

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
    authActions.reset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    authActions.reset();
    server.resetHandlers();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = AuthStateVar.get();

      expect(state.email).toBe('');
      expect(state.token).toBeNull();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeNull();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeNull();
    });
  });

  describe('successful login flow', () => {
    it('should update state to pending when login starts', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.delay(50), ctx.status(200), ctx.json(buildLoginResponse()))
        )
      );

      const promise = authActions.loginUser(buildCredentials());
      expect(AuthStateVar.get().loginLoading).toBe(true);

      await promise;
      expect(AuthStateVar.get().loginLoading).toBe(false);
    });

    it('should update state on successful login', async () => {
      const credentials = buildCredentials();
      const { token } = buildLoginResponse();
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) => res(ctx.status(200), ctx.json({ token })))
      );

      await authActions.loginUser(credentials);

      const state = AuthStateVar.get();

      expect(state.loginLoading).toBe(false);
      expect(state.email).toBe(credentials.email);
      expect(state.token).toBe(token);
      expect(state.loginError).toBeNull();
    });

    it('should normalize email to lowercase', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json(buildLoginResponse()))
        )
      );

      await authActions.loginUser({ email: 'USER@TEST.COM', password: 'pass' });

      const state = AuthStateVar.get();
      expect(state.email).toBe('user@test.com');
    });

    it('should handle multiple successful logins', async () => {
      const firstCredentials = buildCredentials();
      const firstToken = buildToken();
      const secondCredentials = buildCredentials();
      const secondToken = buildToken();
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: firstToken }))
        )
      );

      await authActions.loginUser(firstCredentials);
      expect(AuthStateVar.get().token).toBe(firstToken);

      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: secondToken }))
        )
      );

      await authActions.loginUser(secondCredentials);

      const state = AuthStateVar.get();
      expect(state.token).toBe(secondToken);
      expect(state.email).toBe(secondCredentials.email);
    });
  });

  describe('error handling', () => {
    it('should set error state on 401 authentication error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(401), ctx.json({ message: 'Invalid credentials' }))
        )
      );

      await authActions.loginUser(buildCredentials());

      const state = AuthStateVar.get();
      expect(state.loginLoading).toBe(false);
      expect(state.token).toBeNull();
      expect(state.loginError).toBeTruthy();
    });

    it('should set error state on network failure', async () => {
      server.use(rest.post(API_ENDPOINTS.LOGIN, (_, res) => res.networkError('Failed to fetch')));

      await authActions.loginUser(buildCredentials());

      const state = AuthStateVar.get();
      expect(state.loginLoading).toBe(false);
      expect(state.token).toBeNull();
      expect(state.loginError).toBeTruthy();
    });

    it('should set error state on 400 validation error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(400), ctx.json({ message: 'Invalid data' }))
        )
      );

      await authActions.loginUser({ email: 'invalid', password: '123' });

      const state = AuthStateVar.get();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeTruthy();
    });

    it('should clear previous error on new login attempt', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(401), ctx.json({ message: 'Invalid' }))
        )
      );

      await authActions.loginUser(buildCredentials());
      expect(AuthStateVar.get().loginError).toBeTruthy();

      const newToken = buildToken();
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: newToken }))
        )
      );

      await authActions.loginUser(buildCredentials());

      const state = AuthStateVar.get();
      expect(state.loginError).toBeNull();
      expect(state.token).toBe(newToken);
    });

    it('should handle 500 server error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(500), ctx.json({ message: 'Internal server error' }))
        )
      );

      await authActions.loginUser(buildCredentials());

      const state = AuthStateVar.get();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeTruthy();
    });

    it('should handle various HTTP error codes', async () => {
      const errorCodes = [403, 404, 408, 422, 429, 502, 503, 504];

      for (const code of errorCodes) {
        authActions.reset();
        server.use(
          rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
            res(ctx.status(code), ctx.json({ message: `Error ${code}` }))
          )
        );

        await authActions.loginUser(buildCredentials());

        const state = AuthStateVar.get();
        expect(state.loginLoading).toBe(false);
        expect(state.loginError).toBeTruthy();
      }
    });
  });

  describe('logout action', () => {
    it('should clear all auth state on logout', async () => {
      const credentials = buildCredentials();
      const { token } = buildLoginResponse();
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) => res(ctx.status(200), ctx.json({ token })))
      );

      await authActions.loginUser(credentials);
      expect(AuthStateVar.get().token).toBe(token);
      expect(AuthStateVar.get().email).toBe(credentials.email);

      authActions.logout();

      const state = AuthStateVar.get();
      expect(state.token).toBeNull();
      expect(state.email).toBe('');
      expect(state.loginError).toBeNull();
      expect(state.loginLoading).toBe(false);
      expect(state.registerError).toBeNull();
      expect(state.registerLoading).toBe(false);
    });
  });

  describe('request cancellation', () => {
    it('should handle cancelled requests', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, async (_, res, ctx) => {
          await createDelayedPromise(100);
          return res(ctx.status(200), ctx.json(buildLoginResponse()));
        })
      );

      const abortController = new AbortController();
      const promise = authActions.loginUser(buildCredentials(), abortController.signal);

      abortController.abort();
      await promise;

      const state = AuthStateVar.get();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeNull();
    });
  });

  describe('schema validation', () => {
    it('should handle invalid response schema', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ invalidField: 'value' }))
        )
      );

      await authActions.loginUser(buildCredentials());

      const state = AuthStateVar.get();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeTruthy();
      expect(state.token).toBeNull();
    });

    it('surfaces a login error when a 200 response has an empty body', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) => res(ctx.status(200), ctx.body('')))
      );

      await authActions.loginUser(buildCredentials());

      const state = AuthStateVar.get();
      expect(state.loginError).toBeTruthy();
      expect(state.token).toBeNull();
    });
  });

  describe('registerUser', () => {
    it('should handle successful registration', async () => {
      server.use(
        rest.post(GRAPHQL_URL, (_, res, ctx) =>
          res(ctx.status(200), ctx.json(createUserSuccessBody))
        )
      );

      await authActions.registerUser(registrationCredentials);

      const state = AuthStateVar.get();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeNull();
    });

    it('should set loading state during registration', async () => {
      server.use(
        rest.post(GRAPHQL_URL, async (_, res, ctx) => {
          await createDelayedPromise(50);
          return res(ctx.status(200), ctx.json(createUserSuccessBody));
        })
      );

      const promise = authActions.registerUser(registrationCredentials);
      expect(AuthStateVar.get().registerLoading).toBe(true);

      await promise;
      expect(AuthStateVar.get().registerLoading).toBe(false);

      const state = AuthStateVar.get();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeNull();
    });

    it('should handle validation error from API response', async () => {
      server.use(
        rest.post(GRAPHQL_URL, (_, res, ctx) =>
          res(
            ctx.status(200),
            ctx.json({
              data: {
                createUser: { user: { id: 'u', confirmed: true, email: 456, initials: 123 } },
              },
            })
          )
        )
      );

      await authActions.registerUser(registrationCredentials);

      const state = AuthStateVar.get();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeTruthy();
    });

    it('surfaces a register error when the payload contains no user', async () => {
      server.use(
        rest.post(GRAPHQL_URL, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ data: { createUser: { user: null } } }))
        )
      );

      await authActions.registerUser(registrationCredentials);

      const state = AuthStateVar.get();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeTruthy();
    });

    it('should handle 400 error', async () => {
      server.use(
        rest.post(GRAPHQL_URL, (_, res, ctx) =>
          res(ctx.status(400), ctx.json({ errors: [{ message: 'Bad request' }] }))
        )
      );

      await authActions.registerUser(registrationCredentials);

      const state = AuthStateVar.get();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeTruthy();
    });

    it('should handle 409 conflict error', async () => {
      server.use(
        rest.post(GRAPHQL_URL, (_, res, ctx) =>
          res(ctx.status(409), ctx.json({ errors: [{ message: 'User already exists' }] }))
        )
      );

      await authActions.registerUser(registrationCredentials);

      const state = AuthStateVar.get();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeTruthy();
    });

    it('should handle network failure', async () => {
      server.use(rest.post(GRAPHQL_URL, (_, res) => res.networkError('Failed to fetch')));

      await authActions.registerUser(registrationCredentials);

      const state = AuthStateVar.get();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeTruthy();
    });

    it('should handle non-API errors from RegistrationAPI', async () => {
      const registrationAPI = container.resolve<RegistrationAPI>(TOKENS.RegistrationAPI);
      jest.spyOn(registrationAPI, 'register').mockRejectedValue(new Error('Unexpected failure'));

      await authActions.registerUser(registrationCredentials);

      const state = AuthStateVar.get();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeTruthy();
    });

    it('should handle pre-aborted signal', async () => {
      const abortController = new AbortController();
      abortController.abort();
      server.use(
        rest.post(GRAPHQL_URL, (_, res, ctx) =>
          res(ctx.status(500), ctx.json({ errors: [{ message: 'should not surface' }] }))
        )
      );

      await authActions.registerUser(registrationCredentials, abortController.signal);

      const state = AuthStateVar.get();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeNull();
    });
  });

  describe('loginUser abort handling', () => {
    it('should handle pre-aborted signal', async () => {
      const abortController = new AbortController();
      abortController.abort();

      await authActions.loginUser(buildCredentials(), abortController.signal);

      const state = AuthStateVar.get();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeNull();
    });

    it('should handle DOMException abort from LoginAPI', async () => {
      const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
      jest
        .spyOn(loginAPI, 'login')
        .mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'));

      await authActions.loginUser(buildCredentials());

      const state = AuthStateVar.get();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeNull();
    });

    it('should handle error with AbortError name from LoginAPI', async () => {
      const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
      const abortError = new Error('Operation cancelled');
      abortError.name = 'AbortError';
      jest.spyOn(loginAPI, 'login').mockRejectedValue(abortError);

      await authActions.loginUser(buildCredentials());

      const state = AuthStateVar.get();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeNull();
    });

    it('should handle error with abort in message from LoginAPI', async () => {
      const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
      jest.spyOn(loginAPI, 'login').mockRejectedValue(new Error('Request was aborted by user'));

      await authActions.loginUser(buildCredentials());

      const state = AuthStateVar.get();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeNull();
    });

    it('should not treat non-abort errors as abort', async () => {
      const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
      jest.spyOn(loginAPI, 'login').mockRejectedValue(new Error('Network failure'));

      await authActions.loginUser(buildCredentials());

      const state = AuthStateVar.get();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeTruthy();
    });

    it('should not treat non-Error objects as abort', async () => {
      const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
      jest.spyOn(loginAPI, 'login').mockRejectedValue('string error');

      await authActions.loginUser(buildCredentials());

      const state = AuthStateVar.get();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeTruthy();
    });

    it('should handle null error thrown by LoginAPI', async () => {
      const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
      jest.spyOn(loginAPI, 'login').mockRejectedValue(null);

      await authActions.loginUser(buildCredentials());

      const state = AuthStateVar.get();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeTruthy();
    });

    it('should handle error with undefined message', async () => {
      const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
      const error = new Error();
      error.message = undefined as unknown as string;
      jest.spyOn(loginAPI, 'login').mockRejectedValue(error);

      await authActions.loginUser(buildCredentials());

      const state = AuthStateVar.get();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeTruthy();
    });
  });

  describe('selectors', () => {
    it('should select state values correctly', async () => {
      const credentials = buildCredentials();
      const { token } = buildLoginResponse();
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) => res(ctx.status(200), ctx.json({ token })))
      );

      await authActions.loginUser(credentials);

      const state = AuthStateVar.get();
      expect(AuthStoreSelectors.email(state)).toBe(credentials.email);
      expect(AuthStoreSelectors.token(state)).toBe(token);
      expect(AuthStoreSelectors.loginLoading(state)).toBe(false);
      expect(AuthStoreSelectors.loginError(state)).toBeNull();
      expect(AuthStoreSelectors.registerLoading(state)).toBe(false);
      expect(AuthStoreSelectors.registerError(state)).toBeNull();
      expect(AuthStoreSelectors.isAuthenticated(state)).toBe(true);

      authActions.logout();
      const loggedOut = AuthStateVar.get();
      expect(AuthStoreSelectors.isAuthenticated(loggedOut)).toBe(false);
    });

    it('should select registerUser from state', async () => {
      const user = buildRegistrationResponse();
      AuthStateVar.set({ user });

      const state = AuthStateVar.get();
      expect(AuthStoreSelectors.registerUser(state)).toEqual(user);

      AuthStateVar.set({ user: null });
      expect(AuthStoreSelectors.registerUser(AuthStateVar.get())).toBeNull();
    });
  });

  describe('real integration with DI container', () => {
    it('should use real LoginAPI from DI container', async () => {
      const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
      expect(loginAPI).toBeDefined();

      const credentials = buildCredentials();
      const { token } = buildLoginResponse();
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) => res(ctx.status(200), ctx.json({ token })))
      );

      await authActions.loginUser(credentials);

      const state = AuthStateVar.get();
      expect(state.token).toBe(token);
      expect(state.email).toBe(credentials.email);
    });

    it('should use real RegistrationAPI from DI container', async () => {
      const registrationAPI = container.resolve<RegistrationAPI>(TOKENS.RegistrationAPI);
      expect(registrationAPI).toBeDefined();

      server.use(
        rest.post(GRAPHQL_URL, (_, res, ctx) =>
          res(ctx.status(200), ctx.json(createUserSuccessBody))
        )
      );

      await authActions.registerUser(registrationCredentials);

      const state = AuthStateVar.get();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeNull();
    });

    it('resetRegistration clears registration fields; retryable selector reads it', async () => {
      AuthStateVar.set({
        token: 'keep-me',
        email: 'keep@me.com',
        user: { fullName: 'X', email: 'x@y.com' },
        registerError: { kind: 'unknown', displayMessage: 'oops', retryable: true },
        registerLoading: true,
      });

      expect(AuthStoreSelectors.registerRetryable(AuthStateVar.get())).toBe(true);

      authActions.resetRegistration();

      const state = AuthStateVar.get();
      expect(state.token).toBe('keep-me');
      expect(state.email).toBe('keep@me.com');
      expect(state.user).toBeNull();
      expect(state.registerError).toBeNull();
      expect(state.registerLoading).toBe(false);
      expect(AuthStoreSelectors.registerRetryable(state)).toBeUndefined();
    });

    it('seeds token from preloaded auth when the store module is re-evaluated', async () => {
      const originalEnv = process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN;
      process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN = 'preloaded';

      try {
        await jest.isolateModulesAsync(async () => {
          const mod = await import('@auth/stores');
          expect(mod.AuthStateVar.get().token).toBe('preloaded');
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
      await jest.isolateModulesAsync(async () => {
        (window as Window & { __PRELOADED_AUTH_TOKEN__?: string }).__PRELOADED_AUTH_TOKEN__ =
          'window-token';
        try {
          const mod = await import('@auth/stores');
          expect(mod.AuthStateVar.get().token).toBe('window-token');
        } finally {
          delete (window as Window & { __PRELOADED_AUTH_TOKEN__?: string })
            .__PRELOADED_AUTH_TOKEN__;
        }
      });
    });

    it('trims whitespace from env token', async () => {
      const originalEnv = process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN;
      process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN = '  trimmed  ';

      try {
        await jest.isolateModulesAsync(async () => {
          const mod = await import('@auth/stores');
          expect(mod.AuthStateVar.get().token).toBe('trimmed');
        });
      } finally {
        if (originalEnv === undefined) {
          delete process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN;
        } else {
          process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN = originalEnv;
        }
      }
    });
  });
});
