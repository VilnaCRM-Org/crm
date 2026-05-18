import { configureStore, type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';
import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import type LoginAPI from '@/modules/User/features/Auth/api/login-api';
import type RegistrationAPI from '@/modules/User/features/Auth/api/registration-api';
import type { RegistrationView } from '@/modules/User/features/Auth/components/form-section/types';
import useRegistrationForm from '@/modules/User/features/Auth/hooks/use-registration-form';
import type { RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';
import {
  selectRegistrationError,
  selectRegistrationLoading,
  selectRegistrationRetryable,
  selectRegistrationUser,
} from '@/modules/User/store/registration-selectors';
import {
  registrationReducer,
  registerUser,
  type RegistrationState,
} from '@/modules/User/store/registration-slice';
import type { ThunkExtra } from '@/modules/User/store/types';
import { ErrorHandler } from '@/services/error';
import { ErrorParser } from '@/utils/error';

const mockDispatch = jest.fn();
let mockState: {
  registration: {
    user: unknown;
    loading: boolean;
    error: string | null;
    retryable: boolean;
  };
};

jest.mock('@/stores/hooks', () => ({
  __esModule: true,
  default: (): typeof mockDispatch => mockDispatch,
  useAppSelector: (selector: (state: typeof mockState) => unknown): unknown => selector(mockState),
}));

type TestStore = {
  dispatch: ThunkDispatch<{ registration: RegistrationState }, ThunkExtra, UnknownAction>;
  getState: () => { registration: RegistrationState };
};

let latestForm: ReturnType<typeof useRegistrationForm>;

function RegistrationHookProbe({
  onViewChange,
}: {
  onViewChange?: (view: RegistrationView) => void;
}): JSX.Element {
  latestForm = useRegistrationForm(onViewChange);
  return React.createElement('div', { 'data-testid': 'view' }, latestForm.view);
}

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
    expect(state.error).toBe(
      'There was a problem with the provided information. Please check your input.'
    );
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

  it('re-throws AbortError thrown directly inside the thunk catch block', async () => {
    const store = createStore();
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    (registrationAPI.register as jest.Mock).mockRejectedValue(abortError);

    await expect(
      store.dispatch(registerUser({ email: 'abort@test.com', password: 'pass', fullName: 'Abort' }))
    ).resolves.toMatchObject({ error: expect.objectContaining({ name: 'AbortError' }) });

    const state = store.getState().registration;
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('handles aborted rejection without overriding error', async () => {
    const store = createStore();
    (registrationAPI.register as jest.Mock).mockImplementation(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 50);
      });
    });

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

describe('useRegistrationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState = {
      registration: {
        user: null,
        loading: false,
        error: null,
        retryable: true,
      },
    };
  });

  it('syncs view changes and exposes registration handlers', async () => {
    const onViewChange = jest.fn();
    const data: RegisterUserDto = {
      fullName: '  Test User  ',
      email: 'user@test.com',
      password: 'secret',
    };

    const view = render(React.createElement(RegistrationHookProbe, { onViewChange }));

    expect(screen.getByTestId('view')).toHaveTextContent('form');
    expect(onViewChange).toHaveBeenCalledWith('form');

    act(() => latestForm.handleRetry());
    expect(mockDispatch).not.toHaveBeenCalled();

    act(() => latestForm.handleRegister(data));
    expect(mockDispatch).toHaveBeenCalledTimes(1);

    act(() => latestForm.handleRetry());
    expect(mockDispatch).toHaveBeenCalledTimes(3);

    act(() => latestForm.handleSuccessShown());
    expect(latestForm.formKey).toBe(1);

    act(() => latestForm.handleBackToForm());
    expect(mockDispatch).toHaveBeenCalledTimes(4);

    mockState = {
      registration: {
        user: { email: 'user@test.com' },
        loading: false,
        error: null,
        retryable: false,
      },
    };
    view.rerender(React.createElement(RegistrationHookProbe, { onViewChange }));
    await waitFor(() => expect(screen.getByTestId('view')).toHaveTextContent('success'));

    mockState = {
      registration: {
        user: null,
        loading: false,
        error: 'Registration failed',
        retryable: true,
      },
    };
    view.rerender(React.createElement(RegistrationHookProbe, { onViewChange }));
    await waitFor(() => expect(screen.getByTestId('view')).toHaveTextContent('error'));
    expect(latestForm.errorText).toBe('Registration failed');

    mockState.registration.loading = true;
    view.rerender(React.createElement(RegistrationHookProbe));
    expect(screen.getByTestId('view')).toHaveTextContent('error');
  });

  it('selects every registration state field', () => {
    mockState = {
      registration: {
        user: { email: 'user@test.com' },
        loading: true,
        error: 'Problem',
        retryable: false,
      },
    };

    expect(selectRegistrationUser(mockState as never)).toEqual({ email: 'user@test.com' });
    expect(selectRegistrationLoading(mockState as never)).toBe(true);
    expect(selectRegistrationError(mockState as never)).toBe('Problem');
    expect(selectRegistrationRetryable(mockState as never)).toBe(false);
  });
});
