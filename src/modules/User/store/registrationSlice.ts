import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { z, ZodError, ZodIssue } from 'zod';

import { RegisterUserDto } from '../features/Auth/types/Credentials';

import { ThunkExtra } from './types';

const RegistrationResponseSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  email: z.string().trim().email('Invalid email'),
});

export type SafeUserInfo = z.infer<typeof RegistrationResponseSchema>;

export const registerUser = createAsyncThunk<
  SafeUserInfo,
  RegisterUserDto,
  { extra: ThunkExtra; rejectValue: string }
>('auth/registerUser', async (credentials, { extra, rejectWithValue, signal }) => {
  try {
    const apiResponse = await extra.registrationAPI.register(credentials, { signal });

    const validated = RegistrationResponseSchema.parse(apiResponse);

    return validated;
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.issues.map((e: ZodIssue) => e.message).join('; ');
      return rejectWithValue(messages);
    }

    const message = err instanceof Error ? err.message : String(err ?? 'Unknown error');
    return rejectWithValue(message);
  }
});

interface RegistrationState extends SafeUserInfo {
  loading: boolean;
  error: string | null;
}

const initialState: RegistrationState = {
  fullName: '',
  email: '',
  loading: false,
  error: null,
};

export const registrationSlice = createSlice({
  name: 'register',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.fullName = action.payload.fullName;
        state.email = action.payload.email;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? action.error.message ?? 'Unknown error';
      });
  },
});
export const registrationReducer = registrationSlice.reducer;
