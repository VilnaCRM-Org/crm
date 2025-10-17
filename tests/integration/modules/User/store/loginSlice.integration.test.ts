import { configureStore, type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';
import { rest } from 'msw';

import '../../../setup';
import API_ENDPOINTS from '@/config/apiConfig';
import container from '@/config/DependencyInjectionConfig';
import TOKENS from '@/config/tokens';
import type LoginAPI from '@/modules/User/features/Auth/api/LoginAPI';
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
    const thunkExtraArgument: ThunkExtra = {
      loginAPI: container.resolve<LoginAPI>(TOKENS.LoginAPI),
      registrationAPI: container.resolve(TOKENS.RegistrationAPI),
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

  describe('successful login flow', () => {
    it('should update state to pending when login starts', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, async (_req, res, ctx) => {
          await new Promise<void>((resolve) => {
            setTimeout(() => resolve(), 50);
          });
          return res(ctx.status(200), ctx.json({ token: 'token123' }));
        })
      );

      const promise = store.dispatch(
        loginUser({ email: 'test@test.com', password: 'password123' })
      );

      // Check pending state
      expect(store.getState().auth.loading).toBe(true);
      expect(store.getState().auth.error).toBeNull();

      await promise;
    });

    it('should update state on successful login', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_req, res, ctx) =>
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
        rest.post(API_ENDPOINTS.LOGIN, (_req, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'token', userId: '1', email: 'Test@Test.com' }))
        )
      );

      await store.dispatch(loginUser({ email: 'Test@Example.COM', password: 'pass' }));

      const state = store.getState().auth;
      expect(state.email).toBe('test@example.com');
    });

    it('should replace previous token on successful login', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_req, res, ctx) =>
          res(
            ctx.status(200),
            ctx.json({ token: 'first-token', userId: '1', email: 'user@test.com' })
          )
        )
      );

      await store.dispatch(loginUser({ email: 'user@test.com', password: 'pass1' }));
      expect(store.getState().auth.token).toBe('first-token');

      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_req, res, ctx) =>
          res(
            ctx.status(200),
            ctx.json({ token: 'second-token', userId: '2', email: 'user2@test.com' })
          )
        )
      );

      await store.dispatch(loginUser({ email: 'user2@test.com', password: 'pass2' }));
      expect(store.getState().auth.token).toBe('second-token');
      expect(store.getState().auth.email).toBe('user2@test.com');
    });
  });

  describe('error handling', () => {
    it('should set error state on 401 login failure', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_req, res, ctx) =>
          res(ctx.status(401), ctx.json({ message: 'Invalid credentials' }))
        )
      );

      await store.dispatch(loginUser({ email: 'bad@test.com', password: 'badpass' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.token).toBeNull();
      expect(state.error).toBeTruthy();
      expect(state.error).toContain('Invalid credentials');
    });

    it('should set error state on network failure', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_req, res) => res.networkError('Failed to fetch'))
      );

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.token).toBeNull();
      expect(state.error).toBeTruthy();
    });

    it('should set error state on 400 validation error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_req, res, ctx) =>
          res(ctx.status(400), ctx.json({ message: 'Invalid data' }))
        )
      );

      await store.dispatch(loginUser({ email: 'invalid', password: '123' }));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should clear previous error on new login attempt', async () => {
      // First, cause an error
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_req, res, ctx) =>
          res(ctx.status(401), ctx.json({ message: 'Invalid' }))
        )
      );

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));
      expect(store.getState().auth.error).toBeTruthy();

      // Then try again successfully
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_req, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'new-token' }))
        )
      );

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'correctpass' }));

      const state = store.getState().auth;
      expect(state.error).toBeNull();
      expect(state.token).toBe('new-token');
    });
  });

  describe('logout action', () => {
    it('should clear all auth state on logout', async () => {
      // First login
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_req, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'token123', userId: '1', email: 'user@test.com' }))
        )
      );

      await store.dispatch(loginUser({ email: 'user@test.com', password: 'pass' }));
      expect(store.getState().auth.token).toBe('token123');
      expect(store.getState().auth.email).toBe('user@test.com');

      // Then logout
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
      const controller = new AbortController();

      server.use(
        rest.post(API_ENDPOINTS.LOGIN, async (_req, res, ctx) => {
          await new Promise<void>((resolve) => {
            setTimeout(() => resolve(), 100);
          });
          return res(ctx.status(200), ctx.json({ token: 'token' }));
        })
      );

      const promise = store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));

      controller.abort();

      await promise;

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
    });
  });

  describe('schema validation', () => {
    it('should handle invalid response schema', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_req, res, ctx) =>
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

  describe('thunk extra argument', () => {
    it('should use loginAPI from DI container via thunk extra', async () => {
      const mockResponse = { token: 'di-token', userId: '99', email: 'di@test.com' };

      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_req, res, ctx) =>
          res(ctx.status(200), ctx.json(mockResponse))
        )
      );

      await store.dispatch(loginUser({ email: 'di@test.com', password: 'pass' }));

      const state = store.getState().auth;
      expect(state.token).toBe('di-token');
    });
  });
});
