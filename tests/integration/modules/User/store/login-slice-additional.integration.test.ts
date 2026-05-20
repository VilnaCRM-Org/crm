import { configureStore, type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';
import { rest } from 'msw';

import '../../../setup';
import API_ENDPOINTS from '@/config/apiConfig';
import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import { loginReducer, loginUser, logout } from '@/modules/User/store/login-slice';
import type { ThunkExtra } from '@/modules/User/store/types';
import type LoginAPI from '@auth/api/login-api';
import type RegistrationAPI from '@auth/api/registration-api';

import server from '../../../mocks/server';

type TestState = ReturnType<typeof loginReducer>;
type TestStore = {
  dispatch: ThunkDispatch<{ auth: TestState }, ThunkExtra, UnknownAction>;
  getState: () => { auth: TestState };
};

describe('Login Slice Coverage Tests', () => {
  let store: TestStore;

  beforeEach(() => {
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

  describe('error message fallbacks', () => {
    it('should handle unexpected errors with specific message', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, async () => {
          throw new Error();
        })
      );

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));

      const state = store.getState().auth;

      expect(state.error).toBe('Network error. Please check your connection.');
      expect(state.loading).toBe(false);
    });

    it('should set network error message when login fails due to network', async () => {
      server.use(rest.post(API_ENDPOINTS.LOGIN, (_, res) => res.networkError('Network failure')));

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));

      const state = store.getState().auth;

      expect(state.error).toBe('Network error. Please check your connection.');
      expect(state.loading).toBe(false);
    });

    it('should use action.error.message in async thunk when payload is undefined', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(500), ctx.json({ message: 'Server error' }))
        )
      );

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));

      const state = store.getState().auth;
      expect(state.error).toBe('Internal server error');
    });
  });

  describe('reducer error fallback logic', () => {
    it('should use action.error.message when payload is undefined', () => {
      const initialState = { email: '', token: null, loading: false, error: null };
      const state = loginReducer(initialState, {
        type: loginUser.rejected.type,
        error: { message: 'Custom error message' },
        meta: { requestId: '123', arg: { email: 'test@test.com', password: 'pass' } },
      });

      expect(state.error).toBe('Custom error message');
      expect(state.loading).toBe(false);
    });

    it('should use "Unknown error" when both payload and error.message are undefined', () => {
      const initialState = { email: '', token: null, loading: false, error: null };
      const state = loginReducer(initialState, {
        type: loginUser.rejected.type,
        error: {},
        meta: { requestId: '123', arg: { email: 'test@test.com', password: 'pass' } },
      });

      expect(state.error).toBe('Unknown error');
      expect(state.loading).toBe(false);
    });
  });

  describe('direct reducer and thunk branches', () => {
    it('handles fulfilled/rejected/thrown/aborted/logout flows with injected APIs', async () => {
      const successStore = configureStore({
        reducer: { auth: loginReducer },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware({
            thunk: {
              extraArgument: {
                loginAPI: { login: jest.fn().mockResolvedValue({ token: 'token-123' }) },
                registrationAPI: { register: jest.fn() },
              } satisfies ThunkExtra,
            },
          }),
      }) as TestStore;

      await successStore.dispatch(loginUser({ email: 'user@test.com', password: 'secret' }));
      expect(successStore.getState().auth).toMatchObject({
        email: 'user@test.com',
        token: 'token-123',
        loading: false,
        error: null,
      });

      successStore.dispatch(logout());
      expect(successStore.getState().auth).toMatchObject({
        email: '',
        token: null,
        loading: false,
        error: null,
      });

      const rejectedStore = configureStore({
        reducer: { auth: loginReducer },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware({
            thunk: {
              extraArgument: {
                loginAPI: { login: jest.fn().mockResolvedValue(false) },
                registrationAPI: { register: jest.fn() },
              } satisfies ThunkExtra,
            },
          }),
      }) as TestStore;

      await rejectedStore.dispatch(loginUser({ email: 'bad@test.com', password: 'secret' }));
      expect(rejectedStore.getState().auth.error).toBe('Unexpected response from server');

      const thrownStore = configureStore({
        reducer: { auth: loginReducer },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware({
            thunk: {
              extraArgument: {
                loginAPI: { login: jest.fn().mockRejectedValue(new Error('Network error')) },
                registrationAPI: { register: jest.fn() },
              } satisfies ThunkExtra,
            },
          }),
      }) as TestStore;

      await thrownStore.dispatch(loginUser({ email: 'throw@test.com', password: 'secret' }));
      expect(thrownStore.getState().auth.error).toBe('JavaScript error occurred');

      const abortError = Object.assign(new Error('The operation was aborted'), {
        name: 'AbortError',
      });
      const abortedStore = configureStore({
        reducer: { auth: loginReducer },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware({
            thunk: {
              extraArgument: {
                loginAPI: { login: jest.fn().mockRejectedValue(abortError) },
                registrationAPI: { register: jest.fn() },
              } satisfies ThunkExtra,
            },
          }),
      }) as TestStore;

      const result = await abortedStore.dispatch(
        loginUser({ email: 'abort@test.com', password: 'secret' })
      );
      expect(result).toMatchObject({ error: expect.objectContaining({ name: 'AbortError' }) });
      expect(abortedStore.getState().auth.error).toBeNull();
    });
  });
});
