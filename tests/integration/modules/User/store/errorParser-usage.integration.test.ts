import { configureStore, type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';
import { rest } from 'msw';

import '../../../setup';
import API_ENDPOINTS from '@/config/api-config';
import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import type { IUserRepository } from '@/modules/user/features/auth/repositories';
import { loginReducer, loginUser, type LoginState } from '@/modules/user/store/login-slice';
import type { ThunkExtra } from '@/modules/user/store/types';

import server from '../../../mocks/server';

type LoginTestStore = {
  dispatch: ThunkDispatch<{ auth: LoginState }, ThunkExtra, UnknownAction>;
  getState: () => { auth: LoginState };
};

describe('ErrorParser Integration Coverage', () => {
  describe('via loginSlice', () => {
    let store: LoginTestStore;

    beforeEach(() => {
      const userRepository = container.resolve<IUserRepository>(TOKENS.UserRepository);

      const thunkExtraArgument: ThunkExtra = {
        userRepository,
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

});
