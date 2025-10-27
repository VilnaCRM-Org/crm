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
  type RegistrationState,
} from '@/modules/User/store/registrationSlice';
import type { ThunkExtra } from '@/modules/User/store/types';

import server from '../../../mocks/server';

type TestStore = {
  dispatch: ThunkDispatch<{ registration: RegistrationState }, ThunkExtra, UnknownAction>;
  getState: () => { registration: RegistrationState };
};

describe('Registration Slice Aborted Action Tests', () => {
  let store: TestStore;

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
    }) as TestStore;
  });

  it('should handle cancelled requests', async () => {
    server.use(
      rest.post(API_ENDPOINTS.REGISTER, async (_, res, ctx) => {
        await new Promise((resolve) => {
          setTimeout(resolve, 500);
        });
        return res(ctx.status(201));
      })
    );

    const promise = store.dispatch(
      registerUser({ email: 'test@test.com', password: 'pass', fullName: 'Test' })
    );

    promise.abort();

    await promise.catch(() => {});

    const state = store.getState().registration;

    expect(state.loading).toBe(false);
    expect(state.user).toBeNull();
    expect(state.error).toBeNull();
  });

  it('should parse errors without displayMessage field', async () => {
    server.use(
      rest.post(API_ENDPOINTS.REGISTER, (_, res, ctx) =>
        res(ctx.status(500), ctx.json({ message: 'Internal server Error' }))
      )
    );

    await store.dispatch(
      registerUser({ email: 'test@test.com', password: 'pass', fullName: 'Test' })
    );

    const state = store.getState().registration;
    expect(state.error).toBe('Internal server error');
    expect(state.loading).toBe(false);
  });
});
