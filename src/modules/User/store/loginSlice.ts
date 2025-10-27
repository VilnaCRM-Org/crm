import { UiError, ErrorHandler } from '@/services/error';
import { ErrorParser } from '@/utils/error';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { LoginResponseSchema, type LoginResponse } from '../features/Auth/types/ApiResponses';
import { LoginUserDto } from '../features/Auth/types/Credentials';

import { ThunkExtra } from './types';

type LoginSuccessPayload = LoginResponse & { email: string };

export const loginUser = createAsyncThunk<
  LoginSuccessPayload,
  LoginUserDto,
  { extra: ThunkExtra; rejectValue: UiError }
>('auth/loginUser', async (credentials, { extra, rejectWithValue, signal }) => {
  try {
    const apiResponse = await extra.loginAPI.login(credentials, { signal });
    const parsed = LoginResponseSchema.safeParse(apiResponse);

    if (!parsed.success) {
      const displayMessage = parsed.error.issues.map((i) => i.message).join('; ');
      return rejectWithValue({ displayMessage, retryable: true });
    }

    return { email: credentials.email.toLowerCase(), ...parsed.data };
  } catch (err) {
    const parsedError = ErrorParser.parseHttpError(err);
    const apiError = ErrorHandler.handleAuthError(parsedError);

    return rejectWithValue(apiError);
  }
});

export interface LoginState {
  email: string;
  token: string | null;
  loading: boolean;
  error: string | null;
}
const initialState: LoginState = {
  email: '',
  token: null,
  loading: false,
  error: null,
};

export const loginSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.email = '';
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.email = action.payload.email;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.displayMessage ?? action.error.message ?? 'Unknown error';
      });
  },
});

export const { logout } = loginSlice.actions;
export const loginReducer = loginSlice.reducer;
