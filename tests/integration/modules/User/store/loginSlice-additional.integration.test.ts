import { configureStore, type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';
import { rest } from 'msw';

import '../../../setup';
import API_ENDPOINTS from '@/config/apiConfig';
import container from '@/config/DependencyInjectionConfig';
import TOKENS from '@/config/tokens';
import type LoginAPI from '@/modules/User/features/Auth/api/LoginAPI';
import type RegistrationAPI from '@/modules/User/features/Auth/api/RegistrationAPI';
import { loginReducer, loginUser } from '@/modules/User/store/loginSlice';
import type { ThunkExtra } from '@/modules/User/store/types';

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

    it('should use action.error.message when payload is undefined', async () => {
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
});
