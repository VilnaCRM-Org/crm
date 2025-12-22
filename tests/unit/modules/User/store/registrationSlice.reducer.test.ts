import { configureStore, type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import type LoginAPI from '@/modules/User/features/Auth/api/LoginAPI';
import type RegistrationAPI from '@/modules/User/features/Auth/api/RegistrationAPI';
import { registrationReducer, registerUser, type RegistrationState } from '@/modules/User/store/registrationSlice';
import type { ThunkExtra } from '@/modules/User/store/types';
import { ErrorHandler } from '@/services/error';
import { ErrorParser } from '@/utils/error';

type TestStore = {
  dispatch: ThunkDispatch<{ registration: RegistrationState }, ThunkExtra, UnknownAction>;
  getState: () => { registration: RegistrationState };
};

describe('registrationSlice reducer and thunk coverage', () => {
  const loginAPI = { login: jest.fn() } as unknown as LoginAPI;
  const registrationAPI = { register: jest.fn() } as unknown as RegistrationAPI;

  const createStore = (): TestStore => {
    const thunkExtraArgument: ThunkExtra = {
      loginAPI,
      registrationAPI,
    };

    return configureStore({
      reducer: { registration: registrationReducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          thunk: {
            extraArgument: thunkExtraArgument,
          },
        }),
    }) as TestStore;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles full success flow (pending -> fulfilled)', async () => {
    const store = createStore();
    (registrationAPI.register as jest.Mock).mockResolvedValue({
      fullName: 'Unit Test',
      email: 'unit@test.com',
    });

    const promise = store.dispatch(
      registerUser({ email: 'unit@test.com', password: 'pass123', fullName: 'Unit Test' })
    );

    const pendingState = store.getState().registration;
    expect(pendingState.loading).toBe(true);
    expect(pendingState.error).toBeNull();
    expect(pendingState.retryable).toBeUndefined();

    await promise;
    const finalState = store.getState().registration;
    expect(finalState.loading).toBe(false);
    expect(finalState.user).toEqual({ fullName: 'Unit Test', email: 'unit@test.com' });
    expect(finalState.retryable).toBeUndefined();
  });

  it('handles validation failure with rejectWithValue', async () => {
    const store = createStore();
    (registrationAPI.register as jest.Mock).mockResolvedValue({
      fullName: true,
      email: 123,
    });

    await store.dispatch(
      registerUser({ email: 'bad@test.com', password: 'pass', fullName: 'Bad Data' })
    );

    const state = store.getState().registration;
    expect(state.loading).toBe(false);
    expect(state.user).toBeNull();
    expect(state.error).toContain('fullName');
    expect(state.retryable).toBe(false);
  });

  it('handles error path and maps to retryable', async () => {
    const store = createStore();
    (registrationAPI.register as jest.Mock).mockRejectedValue(new Error('Network down'));

    const parseSpy = jest
      .spyOn(ErrorParser, 'parseHttpError')
      .mockReturnValue({ message: 'parsed' } as never);
    const handleSpy = jest
      .spyOn(ErrorHandler, 'handleAuthError')
      .mockReturnValue({ displayMessage: 'handled', retryable: true });

    await store.dispatch(
      registerUser({ email: 'err@test.com', password: 'pass', fullName: 'Err User' })
    );

    const state = store.getState().registration;
    expect(state.loading).toBe(false);
    expect(state.error).toBe('handled');
    expect(state.retryable).toBe(true);

    parseSpy.mockRestore();
    handleSpy.mockRestore();
  });

  it('resets state via reset action', () => {
    const state = registrationReducer(
      {
        user: { fullName: 'User', email: 'user@test.com' },
        loading: true,
        error: 'oops',
        retryable: true,
      },
      registerUser.pending('req-1', { email: '', password: '', fullName: '' })
    );

    const resetState = registrationReducer(state, { type: 'registration/reset' });

    expect(resetState).toEqual({
      user: null,
      loading: false,
      error: null,
      retryable: undefined,
    });
  });

  it('uses default error message when neither payload nor error message provided', () => {
    const state = registrationReducer(
      {
        user: null,
        loading: true,
        error: null,
        retryable: undefined,
      },
      registerUser.rejected(
        { name: 'Empty', message: undefined as unknown as string },
        'req-unknown',
        { email: '', password: '', fullName: '' }
      )
    );

    expect(state.error).toBe('Unknown error');
    expect(state.retryable).toBeUndefined();
  });

  it('handles aborted rejection without overriding error', async () => {
    const store = createStore();
    (registrationAPI.register as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 50);
        })
    );

    const promise = store.dispatch(
      registerUser({ email: 'abort@test.com', password: 'pass', fullName: 'Abort User' })
    );

    promise.abort();
    await promise.catch(() => {});

    const state = store.getState().registration;
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
});
