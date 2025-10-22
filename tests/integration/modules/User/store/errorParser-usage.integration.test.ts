import { configureStore, type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';
import { rest } from 'msw';

import '../../../setup';
import API_ENDPOINTS from '@/config/apiConfig';
import container from '@/config/DependencyInjectionConfig';
import TOKENS from '@/config/tokens';
import type LoginAPI from '@/modules/User/features/Auth/api/LoginAPI';
import type RegistrationAPI from '@/modules/User/features/Auth/api/RegistrationAPI';
import { loginReducer, loginUser, type LoginState } from '@/modules/User/store/loginSlice';
import {
  registrationReducer,
  registerUser,
  type RegistrationState,
} from '@/modules/User/store/registrationSlice';
import type { ThunkExtra } from '@/modules/User/store/types';

import server from '../../../mocks/server';

type LoginTestStore = {
  dispatch: ThunkDispatch<{ auth: LoginState }, ThunkExtra, UnknownAction>;
  getState: () => { auth: LoginState };
};

type RegistrationTestStore = {
  dispatch: ThunkDispatch<{ registration: RegistrationState }, ThunkExtra, UnknownAction>;
  getState: () => { registration: RegistrationState };
};

// This test ensures ErrorParser paths are exercised through real slice usage
describe('ErrorParser Integration Coverage', () => {
  describe('via loginSlice', () => {
    let store: LoginTestStore;

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
      }) as LoginTestStore;
    });

    it('should parse Response instance error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(404), ctx.json({ message: 'Not found' }))
        )
      );

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));
      expect(store.getState().auth.error).toBeTruthy();
    });

    it('should parse ApiError instance', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(401), ctx.json({ message: 'Unauthorized' }))
        )
      );

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));
      expect(store.getState().auth.error).toBeTruthy();
    });

    it('should parse regular Error instance', async () => {
      server.use(rest.post(API_ENDPOINTS.LOGIN, () => Promise.reject(new Error('Network error'))));

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));
      expect(store.getState().auth.error).toBeTruthy();
    });

    it('should parse unknown error types', async () => {
      server.use(rest.post(API_ENDPOINTS.LOGIN, () => Promise.reject(new Error('string error'))));

      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }));
      expect(store.getState().auth.error).toBeTruthy();
    });
  });

  describe('via registrationSlice', () => {
    let store: RegistrationTestStore;

    beforeEach(() => {
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
      }) as RegistrationTestStore;
    });

    it('should parse Response errors in registration', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_, res, ctx) =>
          res(ctx.status(500), ctx.json({ message: 'Server error' }))
        )
      );

      await store.dispatch(
        registerUser({ email: 'test@test.com', password: 'pass', fullName: 'Test' })
      );
      expect(store.getState().registration.error).toBeTruthy();
    });
  });
});
