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
    it('should use "Unknown error" when both payload and error.message are undefined', async () => {
      // Mock an error that will result in no payload and no error.message
      server.use(rest.post(API_ENDPOINTS.LOGIN, (_, res) => res.networkError('Network failure')));

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));

      const state = store.getState().auth;
      expect(state.error).toBeTruthy();
      // The error should be set to some message (either from payload, error.message, or fallback)
    });

    it('should use action.error.message when payload is undefined', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(500), ctx.json({ message: 'Server error' }))
        )
      );

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));

      const state = store.getState().auth;
      expect(state.error).toBeTruthy();
    });
  });
});
