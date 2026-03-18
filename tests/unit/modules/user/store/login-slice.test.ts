import { configureStore, type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import type LoginAPI from '@/modules/user/features/auth/repositories/login-api';
import type RegistrationAPI from '@/modules/user/features/auth/repositories/registration-api';
import {
  loginReducer,
  loginUser,
  logout,
  type LoginState,
} from '@/modules/user/store/login-slice';
import type { ThunkExtra } from '@/modules/user/store/types';
import { ErrorHandler } from '@/services/error';
import { ErrorParser } from '@/utils/error';

type TestStore = {
  dispatch: ThunkDispatch<{ auth: LoginState }, ThunkExtra, UnknownAction>;
  getState: () => { auth: LoginState };
};

describe('loginSlice reducer and thunk coverage', () => {
  const loginAPI = { login: jest.fn() } as unknown as LoginAPI;
  const registrationAPI = { register: jest.fn() } as unknown as RegistrationAPI;

  const createStore = (): TestStore => {
    const thunkExtraArgument: ThunkExtra = { loginAPI, registrationAPI };

    return configureStore({
      reducer: { auth: loginReducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ thunk: { extraArgument: thunkExtraArgument } }),
    }) as TestStore;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles full success flow (pending -> fulfilled)', async () => {
    const store = createStore();
    (loginAPI.login as jest.Mock).mockResolvedValue({ token: 'abc123' });

    const promise = store.dispatch(
      loginUser({ email: 'User@Test.com', password: 'pass123' })
    );

    const pendingState = store.getState().auth;
    expect(pendingState.loading).toBe(true);
    expect(pendingState.error).toBeNull();

    await promise;
    const finalState = store.getState().auth;
    expect(finalState.loading).toBe(false);
    expect(finalState.token).toBe('abc123');
    expect(finalState.email).toBe('user@test.com');
  });

  it('handles validation failure with rejectWithValue', async () => {
    const store = createStore();
    (loginAPI.login as jest.Mock).mockResolvedValue({ token: 123 });

    await store.dispatch(loginUser({ email: 'bad@test.com', password: 'pass' }));

    const state = store.getState().auth;
    expect(state.loading).toBe(false);
    expect(state.token).toBeNull();
    expect(state.error).toContain('token');
    expect(state.error).toContain('expected string');
  });

  it('handles error path via ErrorParser and ErrorHandler', async () => {
    const store = createStore();
    (loginAPI.login as jest.Mock).mockRejectedValue(new Error('Network down'));

    const parseSpy = jest
      .spyOn(ErrorParser, 'parseHttpError')
      .mockReturnValue({ message: 'parsed' } as never);
    const handleSpy = jest
      .spyOn(ErrorHandler, 'handleAuthError')
      .mockReturnValue({ displayMessage: 'handled', retryable: true });

    await store.dispatch(loginUser({ email: 'err@test.com', password: 'pass' }));

    const state = store.getState().auth;
    expect(state.loading).toBe(false);
    expect(state.error).toBe('handled');

    parseSpy.mockRestore();
    handleSpy.mockRestore();
  });

  it('clears auth state via logout action', () => {
    const store = createStore();

    store.dispatch({ type: 'auth/loginUser/fulfilled', payload: { token: 'tok', email: 'u@u.com' } });
    store.dispatch(logout());

    const state = store.getState().auth;
    expect(state.token).toBeNull();
    expect(state.email).toBe('');
    expect(state.error).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('uses default error message when neither payload nor error message provided', () => {
    const state = loginReducer(
      { email: '', token: null, loading: true, error: null },
      loginUser.rejected(
        { name: 'Empty', message: undefined as unknown as string },
        'req-unknown',
        { email: '', password: '' }
      )
    );

    expect(state.error).toBe('Unknown error');
    expect(state.loading).toBe(false);
  });
});
