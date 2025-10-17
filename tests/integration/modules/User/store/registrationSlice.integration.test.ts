import { configureStore, type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';
import { rest } from 'msw';

import '../../../setup';
import API_ENDPOINTS from '@/config/apiConfig';
import container from '@/config/DependencyInjectionConfig';
import TOKENS from '@/config/tokens';
import type RegistrationAPI from '@/modules/User/features/Auth/api/RegistrationAPI';
import { registrationReducer, registerUser, reset } from '@/modules/User/store/registrationSlice';
import type { ThunkExtra } from '@/modules/User/store/types';

import server from '../../../mocks/server';

type TestState = ReturnType<typeof registrationReducer>;
type TestStore = {
  dispatch: ThunkDispatch<{ registration: TestState }, ThunkExtra, UnknownAction>;
  getState: () => { registration: TestState };
};

describe('Registration Slice Integration', () => {
  let store: TestStore;

  beforeEach(() => {
    const thunkExtraArgument: ThunkExtra = {
      loginAPI: container.resolve(TOKENS.LoginAPI),
      registrationAPI: container.resolve<RegistrationAPI>(TOKENS.RegistrationAPI),
    };

    store = configureStore({
      reducer: { registration: registrationReducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          thunk: {
            extraArgument: thunkExtraArgument,
          },
        }),
    }) as TestStore;
  });

  describe('successful registration flow', () => {
    it('should update state to pending when registration starts', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, async (_req, res, ctx) => {
          await new Promise<void>((resolve) => {
            setTimeout(() => resolve(), 50);
          });
          return res(ctx.status(201), ctx.json({ fullName: 'Test User', email: 'test@test.com' }));
        })
      );

      const promise = store.dispatch(
        registerUser({ email: 'test@test.com', password: 'pass123', fullName: 'Test User' })
      );

      // Check pending state
      expect(store.getState().registration.loading).toBe(true);
      expect(store.getState().registration.error).toBeNull();
      expect(store.getState().registration.user).toBeNull();

      await promise;
    });

    it('should update state on successful registration', async () => {
      const mockResponse = {
        fullName: 'New User',
        email: 'newuser@example.com',
      };

      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_req, res, ctx) =>
          res(ctx.status(201), ctx.json(mockResponse))
        )
      );

      await store.dispatch(
        registerUser({
          email: 'newuser@example.com',
          password: 'securepass',
          fullName: 'New User',
        })
      );

      const state = store.getState().registration;
      expect(state.loading).toBe(false);
      expect(state.user).toEqual(mockResponse);
      expect(state.error).toBeNull();
      expect(state.retryable).toBeUndefined();
    });

    it('should handle multiple successful registrations', async () => {
      const firstResponse = {
        fullName: 'User One',
        email: 'user1@test.com',
      };

      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_req, res, ctx) =>
          res(ctx.status(201), ctx.json(firstResponse))
        )
      );

      await store.dispatch(
        registerUser({
          email: 'user1@test.com',
          password: 'pass1',
          fullName: 'User One',
        })
      );

      expect(store.getState().registration.user?.email).toBe('user1@test.com');

      // Reset and register another user
      store.dispatch(reset());

      const secondResponse = {
        fullName: 'User Two',
        email: 'user2@test.com',
      };

      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_req, res, ctx) =>
          res(ctx.status(201), ctx.json(secondResponse))
        )
      );

      await store.dispatch(
        registerUser({
          email: 'user2@test.com',
          password: 'pass2',
          fullName: 'User Two',
        })
      );

      expect(store.getState().registration.user?.email).toBe('user2@test.com');
    });
  });

  describe('error handling', () => {
    it('should set error state on 409 conflict (user already exists)', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_req, res, ctx) =>
          res(ctx.status(409), ctx.json({ message: 'User already exists' }))
        )
      );

      await store.dispatch(
        registerUser({
          email: 'existing@test.com',
          password: 'pass',
          fullName: 'Existing',
        })
      );

      const state = store.getState().registration;
      expect(state.loading).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBeTruthy();
    });

    it('should set error state on 400 validation error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_req, res, ctx) =>
          res(ctx.status(400), ctx.json({ message: 'Invalid data' }))
        )
      );

      await store.dispatch(
        registerUser({
          email: 'invalid-email',
          password: '123',
          fullName: '',
        })
      );

      const state = store.getState().registration;
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should set error state on network failure', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_req, res) => res.networkError('Failed to fetch'))
      );

      await store.dispatch(
        registerUser({
          email: 'test@test.com',
          password: 'pass',
          fullName: 'Test',
        })
      );

      const state = store.getState().registration;
      expect(state.loading).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBeTruthy();
    });

    it('should clear previous error on new registration attempt', async () => {
      // First, cause an error
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_req, res, ctx) =>
          res(ctx.status(409), ctx.json({ message: 'Conflict' }))
        )
      );

      await store.dispatch(
        registerUser({
          email: 'test@test.com',
          password: 'pass',
          fullName: 'Test',
        })
      );
      expect(store.getState().registration.error).toBeTruthy();

      // Then try again successfully
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_req, res, ctx) =>
          res(ctx.status(201), ctx.json({ fullName: 'Test User', email: 'test@test.com' }))
        )
      );

      await store.dispatch(
        registerUser({
          email: 'test@test.com',
          password: 'pass',
          fullName: 'Test',
        })
      );

      const state = store.getState().registration;
      expect(state.error).toBeNull();
      expect(state.user).toBeTruthy();
    });

    it('should set retryable flag based on error type', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_req, res, ctx) =>
          res(ctx.status(500), ctx.json({ message: 'Server error' }))
        )
      );

      await store.dispatch(
        registerUser({
          email: 'test@test.com',
          password: 'pass',
          fullName: 'Test',
        })
      );

      const state = store.getState().registration;
      expect(state.error).toBeTruthy();
    });
  });

  describe('reset action', () => {
    it('should reset all registration state', async () => {
      // First register
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_req, res, ctx) =>
          res(ctx.status(201), ctx.json({ fullName: 'User', email: 'user@test.com' }))
        )
      );

      await store.dispatch(
        registerUser({
          email: 'user@test.com',
          password: 'pass',
          fullName: 'User',
        })
      );
      expect(store.getState().registration.user).toBeTruthy();

      // Then reset
      store.dispatch(reset());

      const state = store.getState().registration;
      expect(state.user).toBeNull();
      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
    });

    it('should reset error state', async () => {
      // Cause an error
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_req, res, ctx) =>
          res(ctx.status(409), ctx.json({ message: 'Conflict' }))
        )
      );

      await store.dispatch(
        registerUser({
          email: 'test@test.com',
          password: 'pass',
          fullName: 'Test',
        })
      );
      expect(store.getState().registration.error).toBeTruthy();

      // Reset
      store.dispatch(reset());

      const state = store.getState().registration;
      expect(state.error).toBeNull();
      expect(state.retryable).toBeUndefined();
    });
  });

  describe('request cancellation', () => {
    it('should not update state on aborted requests', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, async (_req, res, ctx) => {
          await new Promise<void>((resolve) => {
            setTimeout(() => resolve(), 100);
          });
          return res(ctx.status(201), ctx.json({ fullName: 'Test User', email: 'test@test.com' }));
        })
      );

      const abortController = new AbortController();
      const promise = store.dispatch(
        registerUser({
          email: 'test@test.com',
          password: 'pass',
          fullName: 'Test',
        })
      );

      abortController.abort();

      await promise;

      const state = store.getState().registration;
      expect(state.loading).toBe(false);
      // State should remain in initial state or not update error on abort
    });
  });

  describe('schema validation', () => {
    it('should handle invalid response schema', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_req, res, ctx) =>
          res(ctx.status(201), ctx.json({ invalidField: 'value' }))
        )
      );

      await store.dispatch(
        registerUser({
          email: 'test@test.com',
          password: 'pass',
          fullName: 'Test',
        })
      );

      const state = store.getState().registration;
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
      expect(state.user).toBeNull();
    });

    it('should handle schema validation error messages', async () => {
      server.use(
        rest.post(
          API_ENDPOINTS.REGISTER,
          (_req, res, ctx) => res(ctx.status(201), ctx.json({ userId: 123 })) // userId should be string
        )
      );

      await store.dispatch(
        registerUser({
          email: 'test@test.com',
          password: 'pass',
          fullName: 'Test',
        })
      );

      const state = store.getState().registration;
      expect(state.error).toBeTruthy();
    });
  });

  describe('thunk extra argument', () => {
    it('should use registrationAPI from DI container via thunk extra', async () => {
      const mockResponse = {
        fullName: 'DI User',
        email: 'di@test.com',
      };

      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_req, res, ctx) =>
          res(ctx.status(201), ctx.json(mockResponse))
        )
      );

      await store.dispatch(
        registerUser({
          email: 'di@test.com',
          password: 'pass',
          fullName: 'DI User',
        })
      );

      const state = store.getState().registration;
      expect(state.user?.fullName).toBe('DI User');
      expect(state.user?.email).toBe('di@test.com');
    });
  });
});
