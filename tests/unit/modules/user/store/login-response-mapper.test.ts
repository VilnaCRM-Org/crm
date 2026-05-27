import { configureStore } from '@reduxjs/toolkit';

import LoginResponseMapper from '@/modules/user/store/login-response-mapper';
import { loginReducer, loginUser, logout, type LoginState } from '@/modules/user/store/login-slice';
import type { ThunkExtra } from '@/modules/user/store/types';

type LoginStore = {
  dispatch: (action: unknown) => Promise<unknown> | unknown;
  getState: () => { auth: LoginState };
};

function createLoginStore(loginAPI: ThunkExtra['loginAPI']): LoginStore {
  return configureStore({
    reducer: { auth: loginReducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: {
            loginAPI,
            registrationAPI: { register: jest.fn() },
          } satisfies ThunkExtra,
        },
      }),
  }) as unknown as LoginStore;
}

describe('LoginResponseMapper', () => {
  const mapper = new LoginResponseMapper();

  it('maps a valid login response and normalizes the email', () => {
    const result = mapper.map({ token: 'abc123' }, 'USER@EXAMPLE.COM');

    expect(result).toEqual({
      ok: true,
      value: {
        email: 'user@example.com',
        token: 'abc123',
      },
    });
  });

  it('keeps the normalized email when the raw payload also contains email-like data', () => {
    const result = mapper.map({ token: 'abc123', email: 'SERVER@EXAMPLE.COM' }, 'USER@EXAMPLE.COM');

    expect(result).toEqual({
      ok: true,
      value: {
        email: 'user@example.com',
        token: 'abc123',
      },
    });
  });

  it('returns a UI error when the login response shape is invalid', () => {
    const result = mapper.map({ token: 123 }, 'user@example.com');

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected invalid login response to fail');
    }

    expect(result.error).toEqual({
      displayMessage: 'Unexpected response from server',
      retryable: false,
    });
  });
});

describe('loginSlice reducer and thunk coverage', () => {
  it('handles pending, fulfilled, rejected, abort, fallback, and logout reducers', async () => {
    const successStore = createLoginStore({
      login: jest.fn().mockResolvedValue({ token: 'token-123' }),
    } as never);

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

    const rejectedStore = createLoginStore({
      login: jest.fn().mockResolvedValue(false),
    } as never);

    await rejectedStore.dispatch(loginUser({ email: 'bad@test.com', password: 'secret' }));
    expect(rejectedStore.getState().auth.error).toBe('Unexpected response from server');

    const aborted = Object.assign(new Error('The operation was aborted'), { name: 'AbortError' });
    const abortedStore = createLoginStore({
      login: jest.fn().mockRejectedValue(aborted),
    } as never);

    await abortedStore.dispatch(loginUser({ email: 'abort@test.com', password: 'secret' }));
    expect(abortedStore.getState().auth.error).toBeNull();

    const thrownStore = createLoginStore({
      login: jest.fn().mockRejectedValue(new Error('Network error')),
    } as never);

    await thrownStore.dispatch(loginUser({ email: 'throw@test.com', password: 'secret' }));
    expect(thrownStore.getState().auth.error).toBe('JavaScript error occurred');

    const fallbackState: LoginState = { email: '', token: null, loading: true, error: null };
    expect(
      loginReducer(fallbackState, {
        type: loginUser.rejected.type,
        error: { message: 'Thunk failure' },
        meta: { aborted: false },
      })
    ).toMatchObject({ loading: false, error: 'Thunk failure' });
    expect(
      loginReducer(fallbackState, {
        type: loginUser.rejected.type,
        error: {},
        meta: { aborted: false },
      })
    ).toMatchObject({ loading: false, error: 'Unknown error' });
  });
});
