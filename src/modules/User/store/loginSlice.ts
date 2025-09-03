import container from '@/config/DependencyInjectionConfig';
import TOKENS from '@/config/tokens';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { z, ZodError, ZodIssue } from 'zod';

import { type LoginAPI } from '../features/Auth/api';
import { LoginUserDto } from '../features/Auth/types/Credentials';

const LoginResponseSchema = z.object({
  token: z.string(),
});

type LoginSuccessPayload = z.infer<typeof LoginResponseSchema> & { email: string };

export const loginUser = createAsyncThunk<
  LoginSuccessPayload,
  LoginUserDto,
  { rejectValue: string }
>('auth/loginUser', async (credentials, { rejectWithValue }) => {
  try {
    // lazy resolve avoids TypeInfo error
    const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
    const apiResponse = await loginAPI.login(credentials);

    const validated = LoginResponseSchema.parse(apiResponse);

    return { email: credentials.email, ...validated };
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.issues.map((e: ZodIssue) => e.message).join('; ');
      return rejectWithValue(messages);
    }
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
export const loginReducer = loginSlice.reducer;
