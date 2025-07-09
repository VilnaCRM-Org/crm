import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import LoginAPI from '@/modules/User/features/Auth/api/LoginAPI';
import { RegisterUserDto, LoginUserDto } from '@/modules/User/features/Auth/types/Credentials';

import RegistrationAPI from '../features/Auth/api/RegistrationAPI';

const registrationAPI = new RegistrationAPI();
type SafeUserInfo = Omit<RegisterUserDto, 'password'>;

export const registerUser = createAsyncThunk<
  SafeUserInfo,
  RegisterUserDto,
  { rejectValue: string }
>('auth/registerUser', async (credentials, { rejectWithValue }) => {
  try {
    await registrationAPI.register(credentials);
    return {
      fullName: credentials.fullName,
      email: credentials.email,
    };
  } catch (err) {
    return rejectWithValue((err as Error).message);
  }
});

const loginAPI = new LoginAPI();

export const loginUser = createAsyncThunk<
  { email: string; token: string },
  LoginUserDto,
  { rejectValue: string }
>('auth/loginUser', async (credentials, { rejectWithValue }) => {
  try {
    const { token } = await loginAPI.login(credentials);
    return { email: credentials.email, token };
  } catch (err) {
    return rejectWithValue((err as Error).message);
  }
});

interface AuthState extends SafeUserInfo {
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  fullName: '',
  email: '',
  token: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(registerUser.pending, (state) => ({
        ...state,
        loading: true,
        error: null,
      }))
      .addCase(registerUser.fulfilled, (state, action) => ({
        ...state,
        loading: false,
        fullName: action.payload.fullName,
        email: action.payload.email,
      }))
      .addCase(registerUser.rejected, (state, action) => ({
        ...state,
        loading: false,
        error: action.payload ?? action.error.message ?? 'Unknown error',
      }))
      .addCase(loginUser.pending, (state) => ({
        ...state,
        loading: true,
        error: null,
      }))
      .addCase(loginUser.fulfilled, (state, action) => ({
        ...state,
        loading: false,
        token: action.payload.token,
        email: action.payload.email,
      }))
      .addCase(loginUser.rejected, (state, action) => ({
        ...state,
        loading: false,
        error: action.payload ?? action.error.message ?? 'Unknown error',
      })),
});

export default authSlice.reducer;
