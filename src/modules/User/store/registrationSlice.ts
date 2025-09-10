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
>('registration/registerUser', async (credentials, { extra, rejectWithValue, signal }) => {
  try {
    const apiResponse = await extra.registrationAPI.register(credentials, { signal });

    const parsed = RegistrationResponseSchema.safeParse(apiResponse);
    if (!parsed.success) {
      const displayMessage = parsed.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('\n');
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
        state.retryable = undefined;
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        if (action.meta.aborted) {
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
