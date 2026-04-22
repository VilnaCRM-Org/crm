import { UiError, ErrorHandler } from '@/services/error';
import { ErrorParser } from '@/utils/error';
import { ActionReducerMapBuilder, createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { LoginResponseSchema, type LoginResponse } from '@/modules/User/features/Auth/types/ApiResponses';
import { LoginUserDto } from '@/modules/User/features/Auth/types/Credentials';
import { ThunkExtra } from '@/modules/User/store/types';

type LoginSuccessPayload = LoginResponse & { email: string };

function parseLoginResponse(
  apiResponse: unknown,
  email: string
): { ok: true; value: LoginSuccessPayload } | { ok: false; error: UiError } {
  const parsed = LoginResponseSchema.safeParse(apiResponse);
  if (!parsed.success) {
    const displayMessage = parsed.error.issues.map((i) => i.message).join('; ');
    return { ok: false, error: { displayMessage, retryable: false } };
  }
  return { ok: true, value: { email: email.toLowerCase(), ...parsed.data } };
}

function toUiError(err: unknown): UiError {
  return ErrorHandler.handleAuthError(ErrorParser.parseHttpError(err));
}

export const loginUser = createAsyncThunk<
  LoginSuccessPayload,
  LoginUserDto,
  { extra: ThunkExtra; rejectValue: UiError }
>('auth/loginUser', async (credentials, { extra, rejectWithValue, signal }) => {
  try {
    const apiResponse = await extra.loginAPI.login(credentials, { signal });
    const result = parseLoginResponse(apiResponse, credentials.email);
    return result.ok ? result.value : rejectWithValue(result.error);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw err;
    }
    return rejectWithValue(toUiError(err));
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

function handlePending(state: LoginState): void {
  state.loading = true;
  state.error = null;
}

function handleFulfilled(
  state: LoginState,
  action: PayloadAction<LoginSuccessPayload>
): void {
  state.loading = false;
  state.email = action.payload.email;
  state.token = action.payload.token;
}

function handleRejected(
  state: LoginState,
  action: ReturnType<typeof loginUser.rejected>
): void {
  state.loading = false;
  if (action.meta.aborted) return;
  state.error = action.payload?.displayMessage ?? action.error.message ?? 'Unknown error';
}

function buildExtraReducers(builder: ActionReducerMapBuilder<LoginState>): void {
  builder
    .addCase(loginUser.pending, handlePending)
    .addCase(loginUser.fulfilled, handleFulfilled)
    .addCase(loginUser.rejected, handleRejected);
}

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
  extraReducers: buildExtraReducers,
});

export const { logout } = loginSlice.actions;
export const loginReducer = loginSlice.reducer;
