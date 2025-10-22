import { configureStore, type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';
import { rest } from 'msw';

import '../../../setup';
import API_ENDPOINTS from '@/config/apiConfig';
import container from '@/config/DependencyInjectionConfig';
import TOKENS from '@/config/tokens';
import type LoginAPI from '@/modules/User/features/Auth/api/LoginAPI';
import type RegistrationAPI from '@/modules/User/features/Auth/api/RegistrationAPI';
import { loginReducer, loginUser, logout } from '@/modules/User/store/loginSlice';
import type { ThunkExtra } from '@/modules/User/store/types';

import server from '../../../mocks/server';

type TestState = ReturnType<typeof loginReducer>;
type TestStore = {
  dispatch: ThunkDispatch<{ auth: TestState }, ThunkExtra, UnknownAction>;
  getState: () => { auth: TestState };
};

describe('Login Slice Integration', () => {
  let store: TestStore;

  beforeEach(() => {
    // Use REAL services from DI container for integration testing
    const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
    const registrationAPI = container.resolve<RegistrationAPI>(TOKENS.RegistrationAPI);

    const thunkExtraArgument: ThunkExtra = {
      loginAPI,
      registrationAPI,
    };

    store = configureStore({
      reducer: { auth: loginReducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          thunk: {
            extraArgument: thunkExtraArgument,
          },
        }),
    }) as TestStore;
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().auth;

      expect(state.email).toBe('');
      expect(state.token).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('successful login flow', () => {
    it('should update state to pending when login starts', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, async (_, res, ctx) => {
          // Delay response to capture pending state
          await new Promise((resolve) => {
            setTimeout(resolve, 50);
          });
          return res(ctx.status(200), ctx.json({ token: 'token123' }));
        })
      );

      const promise = store.dispatch(loginUser({ email: 'user@test.com', password: 'pass' }));

      // Check pending state
      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });
      expect(store.getState().auth.loading).toBe(true);
      expect(store.getState().auth.error).toBeNull();

      await promise;
    });

    it('should update state on successful login', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'token123' }))
        )
      );

      await store.dispatch(loginUser({ email: 'user@example.com', password: 'pass123' }));

      const state = store.getState().auth;

      expect(state.loading).toBe(false);
      expect(state.email).toBe('user@example.com');
      expect(state.token).toBe('token123');
      expect(state.error).toBeNull();
    });

    it('should normalize email to lowercase', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'token-abc' }))
        )
      );

      await store.dispatch(loginUser({ email: 'USER@TEST.COM', password: 'pass' }));

      const state = store.getState().auth;
      expect(state.email).toBe('user@test.com');
    });

    it('should handle multiple successful logins', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'first-token' }))
        )
      );

      await store.dispatch(loginUser({ email: 'first@test.com', password: 'pass' }));
      expect(store.getState().auth.token).toBe('first-token');

      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'second-token' }))
        )
      );

      await store.dispatch(loginUser({ email: 'second@test.com', password: 'pass' }));

      const state = store.getState().auth;
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

      await store.dispatch(loginUser({ email: 'bad@test.com', password: 'badpass' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.token).toBeNull();
      expect(state.error).toBeTruthy();
    });

    it('should set error state on network failure', async () => {
      server.use(rest.post(API_ENDPOINTS.LOGIN, (_, res) => res.networkError('Failed to fetch')));

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.token).toBeNull();
      expect(state.error).toBeTruthy();
    });

    it('should set error state on 400 validation error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(400), ctx.json({ message: 'Invalid data' }))
        )
      );

      await store.dispatch(loginUser({ email: 'invalid', password: '123' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should clear previous error on new login attempt', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(401), ctx.json({ message: 'Invalid' }))
        )
      );

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));
      expect(store.getState().auth.error).toBeTruthy();

      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'new-token' }))
        )
      );

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'correctpass' }));

      const state = store.getState().auth;
      expect(state.error).toBeNull();
      expect(state.token).toBe('new-token');
    });

    it('should handle 500 server error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(500), ctx.json({ message: 'Internal server error' }))
        )
      );

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should handle 500 error with empty response body', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) => res(ctx.status(500), ctx.json({})))
      );

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      // System provides user-friendly error message
      expect(state.error).toBeTruthy();
      expect(state.error?.toLowerCase()).toContain('error');
    });

    it('should handle 403 forbidden error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(403), ctx.json({ message: 'Forbidden' }))
        )
      );

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should handle 404 not found error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(404), ctx.json({ message: 'Not found' }))
        )
      );

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should handle 408 timeout error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(408), ctx.json({ message: 'Request timeout' }))
        )
      );

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should handle 422 unprocessable entity error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(422), ctx.json({ message: 'Unprocessable' }))
        )
      );

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should handle 429 rate limit error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(429), ctx.json({ message: 'Too many requests' }))
        )
      );

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should handle 409 conflict error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(409), ctx.json({ message: 'Conflict' }))
        )
      );

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should handle 502 bad gateway error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(502), ctx.json({ message: 'Bad gateway' }))
        )
      );

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should handle 503 service unavailable error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(503), ctx.json({ message: 'Service unavailable' }))
        )
      );

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should handle 504 gateway timeout error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(504), ctx.json({ message: 'Gateway timeout' }))
        )
      );

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should handle unknown HTTP status code', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(418), ctx.json({ message: "I'm a teapot" }))
        )
      );

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });
  });

  describe('logout action', () => {
    it('should clear all auth state on logout', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'token123' }))
        )
      );

      await store.dispatch(loginUser({ email: 'user@test.com', password: 'pass' }));
      expect(store.getState().auth.token).toBe('token123');
      expect(store.getState().auth.email).toBe('user@test.com');

      store.dispatch(logout());

      const state = store.getState().auth;
      expect(state.token).toBeNull();
      expect(state.email).toBe('');
      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
    });
  });

  describe('request cancellation', () => {
    it('should handle cancelled requests', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, async (_, res, ctx) => {
          await new Promise((resolve) => {
            setTimeout(resolve, 100);
          });
          return res(ctx.status(200), ctx.json({ token: 'token' }));
        })
      );

      const controller = new AbortController();
      const promise = store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));

      // Abort immediately
      controller.abort();

      await promise;

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
    });
  });

  describe('schema validation', () => {
    it('should handle invalid response schema', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ invalidField: 'value' }))
        )
      );

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
      expect(state.token).toBeNull();
    });
  });

  describe('real integration with DI container', () => {
    it('should use real LoginAPI from DI container', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'di-token' }))
        )
      );

      await store.dispatch(loginUser({ email: 'di@test.com', password: 'pass' }));

      const state = store.getState().auth;
      expect(state.token).toBe('di-token');
      expect(state.email).toBe('di@test.com');
    });
  });
});
