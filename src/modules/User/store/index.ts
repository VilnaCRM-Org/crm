import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import RegisterUserDto from '@/modules/User/features/Auth/types/Credentials';

import RegistrationAPI from '../features/Auth/api/RegistrationAPI';

const registrationAPI = new RegistrationAPI();

export const registerUser = createAsyncThunk<
  { fullName: string; email: string },
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

type SafeUserInfo = Omit<RegisterUserDto, 'password'>;

interface AuthState extends SafeUserInfo {
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  fullName: '',
  email: '',
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
      })),
});

export default authSlice.reducer;
