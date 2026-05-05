import { ErrorHandler, UiError } from '@/services/error';
import { ErrorParser } from '@/utils/error';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import {
  validateRegistrationResponse,
  type SafeUserInfo,
} from '@/modules/User/features/Auth/types/api-responses';
import { RegisterUserDto } from '@/modules/User/features/Auth/types/credentials';

import { ThunkExtra } from './types';

export const registerUser = createAsyncThunk<
  SafeUserInfo,
  RegisterUserDto,
  { extra: ThunkExtra; rejectValue: UiError }
>('registration/registerUser', async (credentials, { extra, rejectWithValue, signal }) => {
  try {
    const apiResponse = await extra.registrationAPI.register(credentials, { signal });

    const parsed = validateRegistrationResponse(apiResponse);
    if (!parsed.success) {
      const displayMessage = parsed.errors.join('\n');
      return rejectWithValue({ displayMessage, retryable: false });
    }

    return parsed.data;
  } catch (err) {
    const parsedError = ErrorParser.parseHttpError(err);
    const apiError = ErrorHandler.handleAuthError(parsedError);

    return rejectWithValue(apiError);
  }
});

export interface RegistrationState {
  user: SafeUserInfo | null;
  loading: boolean;
  error: string | null;
  retryable?: boolean;
}

const initialState: RegistrationState = {
  user: null,
  loading: false,
  error: null,
};

export const registrationSlice = createSlice({
  name: 'registration',
  initialState,
  reducers: {
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.retryable = undefined;
        state.user = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.retryable = undefined;
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        if (action.meta.aborted) {
          state.loading = false;
          return;
        }
        state.loading = false;
        state.error = action.payload?.displayMessage ?? action.error.message ?? 'Unknown error';
        state.retryable = action.payload?.retryable;
      });
  },
});
export const registrationReducer = registrationSlice.reducer;
export const { reset } = registrationSlice.actions;
