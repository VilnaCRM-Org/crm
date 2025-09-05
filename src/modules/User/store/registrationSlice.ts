import { UiError, ErrorHandler } from '@/services/error';
import { ErrorParser } from '@/utils/error';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { RegistrationResponseSchema, SafeUserInfo } from '../features/Auth/types/ApiResponses';
import { RegisterUserDto } from '../features/Auth/types/Credentials';

import { ThunkExtra } from './types';

export const registerUser = createAsyncThunk<
  SafeUserInfo,
  RegisterUserDto,
  { extra: ThunkExtra; rejectValue: UiError }
>('auth/registerUser', async (credentials, { extra, rejectWithValue, signal }) => {
  try {
    const apiResponse = await extra.registrationAPI.register(credentials, { signal });

    const parsed = RegistrationResponseSchema.safeParse(apiResponse);
    if (!parsed.success) {
      const displayMessage = parsed.error.issues.map((i) => i.message).join('; ');
      return rejectWithValue({ displayMessage, retryable: true });
    }
    return parsed.data;
  } catch (err) {
    const parsedError = ErrorParser.parseHttpError(err);
    const apiError = ErrorHandler.handleAuthError(parsedError);

    return rejectWithValue(apiError);
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
        state.error = action.payload?.displayMessage ?? action.error.message ?? 'Unknown error';
      });
  },
});
export const registrationReducer = registrationSlice.reducer;
