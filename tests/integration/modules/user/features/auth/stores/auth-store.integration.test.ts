import { rest } from 'msw';

import '../../../../../setup';
import API_ENDPOINTS from '@/config/api-config';
import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import type LoginAPI from '@auth/repositories/login-api';
import type RegistrationAPI from '@auth/repositories/registration-api';
import { AuthStateVar, AuthStoreSelectors, authActions } from '@auth/stores';

import server, { GRAPHQL_URL } from '../../../../../mocks/server';

const registrationCredentials = {
  email: 'test@example.com',
  password: 'password123',
  fullName: 'Test User',
};

const createUserSuccessBody = {
  data: {
    createUser: {
      user: { id: 'u1', confirmed: true, email: 'test@example.com', initials: 'Test User' },
      clientMutationId: 'c1',
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
          res(ctx.delay(50), ctx.status(200), ctx.json({ token: 'token123' }))
        )
      );

      const promise = authActions.loginUser({ email: 'user@test.com', password: 'pass' });
      expect(AuthStateVar.get().loginLoading).toBe(true);

      await promise;
      expect(AuthStateVar.get().loginLoading).toBe(false);
    });

    it('should update state on successful login', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'token123' }))
        )
      );

      await authActions.loginUser({ email: 'user@example.com', password: 'pass123' });

      const state = AuthStateVar.get();

      expect(state.loginLoading).toBe(false);
      expect(state.email).toBe('user@example.com');
      expect(state.token).toBe('token123');
      expect(state.loginError).toBeNull();
    });

    it('should normalize email to lowercase', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'token-abc' }))
        )
      );

      await authActions.loginUser({ email: 'USER@TEST.COM', password: 'pass' });

      const state = AuthStateVar.get();
      expect(state.email).toBe('user@test.com');
    });

    it('should handle multiple successful logins', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'first-token' }))
        )
      );

      await authActions.loginUser({ email: 'first@test.com', password: 'pass' });
      expect(AuthStateVar.get().token).toBe('first-token');

      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'second-token' }))
        )
      );

      await authActions.loginUser({ email: 'second@test.com', password: 'pass' });

      const state = AuthStateVar.get();
      expect(state.token).toBe('second-token');
      expect(state.email).toBe('second@test.com');
    });
  });

  describe('error handling', () => {
    it('should set error state on 401 authentication error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(401), ctx.json({ message: 'Invalid credentials' }))
        )
      );

      await authActions.loginUser({ email: 'bad@test.com', password: 'badpass' });

      const state = AuthStateVar.get();
      expect(state.loginLoading).toBe(false);
      expect(state.token).toBeNull();
      expect(state.loginError).toBeTruthy();
    });

    it('should set error state on network failure', async () => {
      server.use(rest.post(API_ENDPOINTS.LOGIN, (_, res) => res.networkError('Failed to fetch')));

      await authActions.loginUser({ email: 'test@test.com', password: 'pass' });

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

      await authActions.loginUser({ email: 'test@test.com', password: 'pass' });
      expect(AuthStateVar.get().loginError).toBeTruthy();

      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'new-token' }))
        )
      );

      await authActions.loginUser({ email: 'test@test.com', password: 'correctpass' });

      const state = AuthStateVar.get();
      expect(state.loginError).toBeNull();
      expect(state.token).toBe('new-token');
    });

    it('should handle 500 server error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(500), ctx.json({ message: 'Internal server error' }))
        )
      );

      await authActions.loginUser({ email: 'test@test.com', password: 'pass' });

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

        await authActions.loginUser({ email: 'test@test.com', password: 'pass' });

        const state = AuthStateVar.get();
        expect(state.loginLoading).toBe(false);
        expect(state.loginError).toBeTruthy();
      }
    });
  });

  describe('logout action', () => {
    it('should clear all auth state on logout', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'token123' }))
        )
      );

      await authActions.loginUser({ email: 'user@test.com', password: 'pass' });
      expect(AuthStateVar.get().token).toBe('token123');
      expect(AuthStateVar.get().email).toBe('user@test.com');

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
          return res(ctx.status(200), ctx.json({ token: 'token' }));
        })
      );

      const abortController = new AbortController();
      const promise = authActions.loginUser(
        { email: 'test@test.com', password: 'pass' },
        abortController.signal
      );

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

      await authActions.loginUser({ email: 'test@test.com', password: 'pass' });

      const state = AuthStateVar.get();
      expect(state.loginLoading).toBe(false);
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

      await authActions.loginUser(
        { email: 'test@test.com', password: 'pass' },
        abortController.signal
      );

      const state = AuthStateVar.get();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeNull();
    });

    it('should handle DOMException abort from LoginAPI', async () => {
      const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
      jest
        .spyOn(loginAPI, 'login')
        .mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'));

      await authActions.loginUser({ email: 'test@test.com', password: 'pass' });

      const state = AuthStateVar.get();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeNull();
    });

    it('should handle error with AbortError name from LoginAPI', async () => {
      const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
      const abortError = new Error('Operation cancelled');
      abortError.name = 'AbortError';
      jest.spyOn(loginAPI, 'login').mockRejectedValue(abortError);

      await authActions.loginUser({ email: 'test@test.com', password: 'pass' });

      const state = AuthStateVar.get();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeNull();
    });

    it('should handle error with abort in message from LoginAPI', async () => {
      const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
      jest.spyOn(loginAPI, 'login').mockRejectedValue(new Error('Request was aborted by user'));

      await authActions.loginUser({ email: 'test@test.com', password: 'pass' });

      const state = AuthStateVar.get();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeNull();
    });

    it('should not treat non-abort errors as abort', async () => {
      const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
      jest.spyOn(loginAPI, 'login').mockRejectedValue(new Error('Network failure'));

      await authActions.loginUser({ email: 'test@test.com', password: 'pass' });

      const state = AuthStateVar.get();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeTruthy();
    });

    it('should not treat non-Error objects as abort', async () => {
      const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
      jest.spyOn(loginAPI, 'login').mockRejectedValue('string error');

      await authActions.loginUser({ email: 'test@test.com', password: 'pass' });

      const state = AuthStateVar.get();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeTruthy();
    });

    it('should handle null error thrown by LoginAPI', async () => {
      const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
      jest.spyOn(loginAPI, 'login').mockRejectedValue(null);

      await authActions.loginUser({ email: 'test@test.com', password: 'pass' });

      const state = AuthStateVar.get();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeTruthy();
    });

    it('should handle error with undefined message', async () => {
      const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
      const error = new Error();
      error.message = undefined as unknown as string;
      jest.spyOn(loginAPI, 'login').mockRejectedValue(error);

      await authActions.loginUser({ email: 'test@test.com', password: 'pass' });

      const state = AuthStateVar.get();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeTruthy();
    });
  });

  describe('selectors', () => {
    it('should select state values correctly', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'sel-token' }))
        )
      );

      await authActions.loginUser({ email: 'sel@test.com', password: 'pass' });

      const state = AuthStateVar.get();
      expect(AuthStoreSelectors.email(state)).toBe('sel@test.com');
      expect(AuthStoreSelectors.token(state)).toBe('sel-token');
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
      const user = { fullName: 'Jane Doe', email: 'jane@test.com' };
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

      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'di-token' }))
        )
      );

      await authActions.loginUser({ email: 'di@test.com', password: 'pass' });

      const state = AuthStateVar.get();
      expect(state.token).toBe('di-token');
      expect(state.email).toBe('di@test.com');
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
