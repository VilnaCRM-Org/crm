import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { z } from 'zod';

import { LoginUserDto } from '../features/Auth/types/Credentials';

import { ThunkExtra } from './types';

const LoginResponseSchema = z.object({ token: z.string() });

type LoginSuccessPayload = z.infer<typeof LoginResponseSchema> & { email: string };

export const loginUser = createAsyncThunk<
  LoginSuccessPayload,
  LoginUserDto,
  { extra: ThunkExtra; rejectValue: string }
>('auth/loginUser', async (credentials, { extra, rejectWithValue }) => {
  try {
    const apiResponse = await extra.loginAPI.login(credentials);

    const validated = LoginResponseSchema.parse(apiResponse);

    return { email: credentials.email, ...validated };
  } catch (err) {
    return rejectWithValue((err as Error).message);
  }
});

interface LoginState {
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
        state.error = action.payload ?? action.error.message ?? 'Unknown error';
      });
  },
});

export const { logout } = loginSlice.actions;
export const loginReducer = loginSlice.reducer;
