import { configureStore, type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';
import { rest } from 'msw';

import '../../../setup';
import API_ENDPOINTS from '@/config/api-config';
import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import type LoginAPI from '@/modules/user/features/auth/repositories/login-api';
import type RegistrationAPI from '@/modules/user/features/auth/repositories/registration-api';
import {
  registrationReducer,
  registerUser,
  type RegistrationState,
} from '@/modules/user/store/registration-slice';
import type { ThunkExtra } from '@/modules/user/store/types';

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

    const result = await promise;
    expect(result.meta.requestStatus).toBe('rejected');
    if (result.meta.requestStatus === 'rejected') {
      expect(result.meta.aborted).toBe(true);
    }

    const state = store.getState().registration;

    expect(state.loading).toBe(false);
    expect(state.user).toBeNull();
    expect(state.error).toBeNull();
  });

  it('rethrows AbortError so RTK marks the action as aborted', async () => {
    const aborted = new Error('Request aborted');
    aborted.name = 'AbortError';
    const registrationAPI = container.resolve<RegistrationAPI>(TOKENS.RegistrationAPI);
    const registerSpy = jest.spyOn(registrationAPI, 'register').mockRejectedValue(aborted);

    try {
      const result = await store.dispatch(
        registerUser({ email: 'abort@test.com', password: 'pass', fullName: 'Abort' })
      );

      expect(result.meta.requestStatus).toBe('rejected');
      if (result.meta.requestStatus === 'rejected') {
        expect(result.meta.aborted).toBe(true);
      }

      const state = store.getState().registration;
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    } finally {
      registerSpy.mockRestore();
    }
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
