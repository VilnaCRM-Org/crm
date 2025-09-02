import container from '@/config/DependencyInjectionConfig';
import TOKENS from '@/config/tokens';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import type LoginAPI from '../features/Auth/api/LoginAPI';
import { LoginUserDto } from '../features/Auth/types/Credentials';

type LoginSuccessPayload = { email: string; token: string };

export const loginUser = createAsyncThunk<
  LoginSuccessPayload,
  LoginUserDto,
  { rejectValue: string }
>('auth/loginUser', async (credentials, { rejectWithValue }) => {
  try {
    // lazy resolve avoids TypeInfo error
    const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
    const { token } = await loginAPI.login(credentials);
    return { email: credentials.email, token };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err ?? 'Unknown error');
    return rejectWithValue(message);
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
export default loginSlice.reducer;
