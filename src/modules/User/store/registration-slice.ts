import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  ActionReducerMapBuilder,
} from '@reduxjs/toolkit';

import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import AuthUiErrorMapper from '@/modules/User/store/auth-ui-error-mapper';
import RegistrationResponseMapper from '@/modules/User/store/registration-response-mapper';
import { ThunkExtra } from '@/modules/User/store/types';
import type { UiError } from '@/services/error';
import { SafeUserInfo } from '@auth/types/ApiResponses';
import { RegisterUserDto } from '@auth/types/Credentials';

const registrationResponseMapper = new RegistrationResponseMapper();
const authUiErrorMapper = container.resolve<AuthUiErrorMapper>(TOKENS.AuthUiErrorMapper);

export const registerUser = createAsyncThunk<
  SafeUserInfo,
  RegisterUserDto,
  { extra: ThunkExtra; rejectValue: UiError }
>('registration/registerUser', async (credentials, { extra, rejectWithValue, signal }) => {
  try {
    const apiResponse = await extra.registrationAPI.register(credentials, { signal });
    const result = registrationResponseMapper.map(apiResponse);
    return result.ok ? result.value : rejectWithValue(result.error);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw err;
    }

    return rejectWithValue(authUiErrorMapper.map(err));
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

function handlePending(state: RegistrationState): void {
  state.loading = true;
  state.error = null;
  state.retryable = undefined;
  state.user = null;
}

function handleFulfilled(state: RegistrationState, action: PayloadAction<SafeUserInfo>): void {
  state.loading = false;
  state.error = null;
  state.retryable = undefined;
  state.user = action.payload;
}

function handleRejected(
  state: RegistrationState,
  action: ReturnType<typeof registerUser.rejected>
): void {
  state.loading = false;
  if (action.meta.aborted) return;
  state.error = action.payload?.displayMessage ?? action.error.message ?? 'Unknown error';
  state.retryable = action.payload?.retryable;
}

const buildExtraReducers = (builder: ActionReducerMapBuilder<RegistrationState>): void => {
  builder
    .addCase(registerUser.pending, handlePending)
    .addCase(registerUser.fulfilled, handleFulfilled)
    .addCase(registerUser.rejected, handleRejected);
};

export const registrationSlice = createSlice({
  name: 'registration',
  initialState,
  reducers: {
    reset: () => initialState,
  },
  extraReducers: buildExtraReducers,
});
export const registrationReducer = registrationSlice.reducer;
export const { reset } = registrationSlice.actions;
