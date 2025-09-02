import container from '@/config/DependencyInjectionConfig';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import LoginAPI from '../features/Auth/api/LoginAPI';
import { LoginUserDto } from '../features/Auth/types/Credentials';

type LoginResponse = { email: string; token: string };

export const loginUser = createAsyncThunk<LoginResponse, LoginUserDto, { rejectValue: string }>(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      // lazy resolve avoids TypeInfo error
      const loginAPI = container.resolve<LoginAPI>('LoginAPI');
      const { token } = await loginAPI.login(credentials);
      return { email: credentials.email, token };
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

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
