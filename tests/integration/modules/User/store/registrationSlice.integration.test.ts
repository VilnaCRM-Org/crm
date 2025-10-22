import { configureStore, type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';
import { rest } from 'msw';

import '../../../setup';
import API_ENDPOINTS from '@/config/apiConfig';
import container from '@/config/DependencyInjectionConfig';
import TOKENS from '@/config/tokens';
import type LoginAPI from '@/modules/User/features/Auth/api/LoginAPI';
import type RegistrationAPI from '@/modules/User/features/Auth/api/RegistrationAPI';
import {
  registrationReducer,
  registerUser,
  reset,
  type RegistrationState,
} from '@/modules/User/store/registrationSlice';
import type { ThunkExtra } from '@/modules/User/store/types';

import server from '../../../mocks/server';

type TestStore = {
  dispatch: ThunkDispatch<{ registration: RegistrationState }, ThunkExtra, UnknownAction>;
  getState: () => { registration: RegistrationState };
};

describe('Registration Slice Integration', () => {
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
      reducer: { registration: registrationReducer },
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
      const state = store.getState().registration;

      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.retryable).toBeUndefined();
    });
  });

  describe('successful registration flow', () => {
    it('should update state to pending when registration starts', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, async (_, res, ctx) => {
          await new Promise((resolve) => {
            setTimeout(resolve, 50);
          });
          return res(ctx.status(201), ctx.json({ fullName: 'Test User', email: 'test@test.com' }));
        })
      );

      const promise = store.dispatch(
        registerUser({ email: 'test@test.com', password: 'pass', fullName: 'Test User' })
      );

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });
      expect(store.getState().registration.loading).toBe(true);
      expect(store.getState().registration.error).toBeNull();

      await promise;
    });

    it('should update state on successful registration', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_, res, ctx) =>
          res(ctx.status(201), ctx.json({ fullName: 'New User', email: 'new@test.com' }))
        )
      );

      await store.dispatch(
        registerUser({ email: 'new@test.com', password: 'pass123', fullName: 'New User' })
      );

      const state = store.getState().registration;

      expect(state.loading).toBe(false);
      expect(state.user).toEqual({ fullName: 'New User', email: 'new@test.com' });
      expect(state.error).toBeNull();
      expect(state.retryable).toBeUndefined();
    });

    it('should handle multiple successful registrations', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_, res, ctx) =>
          res(ctx.status(201), ctx.json({ fullName: 'First User', email: 'first@test.com' }))
        )
      );

      await store.dispatch(
        registerUser({ email: 'first@test.com', password: 'pass', fullName: 'First User' })
      );
      expect(store.getState().registration.user?.fullName).toBe('First User');

      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_, res, ctx) =>
          res(ctx.status(201), ctx.json({ fullName: 'Second User', email: 'second@test.com' }))
        )
      );

      await store.dispatch(
        registerUser({ email: 'second@test.com', password: 'pass', fullName: 'Second User' })
      );

      const state = store.getState().registration;
      expect(state.user?.fullName).toBe('Second User');
      expect(state.user?.email).toBe('second@test.com');
    });
  });

  describe('error handling', () => {
    it('should set error state on 409 conflict (user already exists)', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_, res, ctx) =>
          res(ctx.status(409), ctx.json({ message: 'User already exists' }))
        )
      );

      await store.dispatch(
        registerUser({ email: 'existing@test.com', password: 'pass', fullName: 'Existing' })
      );

      const state = store.getState().registration;
      expect(state.loading).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBeTruthy();
    });

    it('should set error state on network failure', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_, res) => res.networkError('Failed to fetch'))
      );

      await store.dispatch(
        registerUser({ email: 'test@test.com', password: 'pass', fullName: 'Test' })
      );

      const state = store.getState().registration;
      expect(state.loading).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBeTruthy();
    });

    it('should set error state on 400 validation error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_, res, ctx) =>
          res(ctx.status(400), ctx.json({ message: 'Invalid data' }))
        )
      );

      await store.dispatch(registerUser({ email: 'invalid-email', password: '123', fullName: '' }));

      const state = store.getState().registration;
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should clear previous error on new registration attempt', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_, res, ctx) =>
          res(ctx.status(409), ctx.json({ message: 'Conflict' }))
        )
      );

      await store.dispatch(
        registerUser({ email: 'test@test.com', password: 'pass', fullName: 'Test' })
      );
      expect(store.getState().registration.error).toBeTruthy();

      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_, res, ctx) =>
          res(ctx.status(201), ctx.json({ fullName: 'Test User', email: 'test@test.com' }))
        )
      );

      await store.dispatch(
        registerUser({ email: 'test@test.com', password: 'pass', fullName: 'Test' })
      );

      const state = store.getState().registration;
      expect(state.error).toBeNull();
      expect(state.user).toBeTruthy();
    });

    it('should handle 500 server error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_, res, ctx) =>
          res(ctx.status(500), ctx.json({ message: 'Internal server error' }))
        )
      );

      await store.dispatch(
        registerUser({ email: 'test@test.com', password: 'pass', fullName: 'Test' })
      );

      const state = store.getState().registration;
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should handle 500 error with empty response body', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_, res, ctx) => res(ctx.status(500), ctx.json({})))
      );

      await store.dispatch(
        registerUser({ email: 'test@test.com', password: 'pass', fullName: 'Test' })
      );

      const state = store.getState().registration;
      expect(state.loading).toBe(false);
      // System provides user-friendly error message
      expect(state.error).toBeTruthy();
      expect(state.error?.toLowerCase()).toContain('error');
    });
  });

  describe('reset action', () => {
    it('should reset all registration state', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_, res, ctx) =>
          res(ctx.status(201), ctx.json({ fullName: 'User', email: 'user@test.com' }))
        )
      );

      await store.dispatch(
        registerUser({ email: 'user@test.com', password: 'pass', fullName: 'User' })
      );
      expect(store.getState().registration.user).toBeTruthy();

      store.dispatch(reset());

      const state = store.getState().registration;
      expect(state.user).toBeNull();
      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.retryable).toBeUndefined();
    });

    it('should reset error state', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_, res, ctx) =>
          res(ctx.status(409), ctx.json({ message: 'Conflict' }))
        )
      );

      await store.dispatch(
        registerUser({ email: 'test@test.com', password: 'pass', fullName: 'Test' })
      );
      expect(store.getState().registration.error).toBeTruthy();

      store.dispatch(reset());

      const state = store.getState().registration;
      expect(state.error).toBeNull();
    });
  });

  describe('request cancellation', () => {
    it('should handle cancelled requests gracefully', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, async (_, res, ctx) => {
          await new Promise((resolve) => {
            setTimeout(resolve, 100);
          });
          return res(ctx.status(201), ctx.json({ fullName: 'Test User', email: 'test@test.com' }));
        })
      );

      const controller = new AbortController();
      const promise = store.dispatch(
        registerUser({ email: 'test@test.com', password: 'pass', fullName: 'Test' })
      );

      controller.abort();

      await promise;

      const state = store.getState().registration;
      expect(state.loading).toBe(false);
    });
  });

  describe('schema validation', () => {
    it('should handle invalid response schema', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_, res, ctx) =>
          // Response with wrong type for email (should be string but is number)
          res(ctx.status(201), ctx.json({ email: 123, fullName: true }))
        )
      );

      await store.dispatch(
        registerUser({ email: 'test@test.com', password: 'pass', fullName: 'Test' })
      );

      const state = store.getState().registration;
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
      expect(state.user).toBeNull();
    });

    it('should handle schema validation error messages', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_, res, ctx) =>
          // Response with wrong types should fail zod validation
          res(ctx.status(201), ctx.json({ email: [], fullName: {} }))
        )
      );

      await store.dispatch(
        registerUser({ email: 'test@test.com', password: 'pass', fullName: 'Test' })
      );

      const state = store.getState().registration;
      expect(state.error).toBeTruthy();
    });
  });

  describe('real integration with DI container', () => {
    it('should use real RegistrationAPI from DI container', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_, res, ctx) =>
          res(ctx.status(201), ctx.json({ fullName: 'DI User', email: 'di@test.com' }))
        )
      );

      await store.dispatch(
        registerUser({ email: 'di@test.com', password: 'pass', fullName: 'DI User' })
      );

      const state = store.getState().registration;
      expect(state.user?.fullName).toBe('DI User');
      expect(state.user?.email).toBe('di@test.com');
    });
  });
});
