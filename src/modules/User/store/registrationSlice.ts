import container from '@/config/DependencyInjectionConfig';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import RegistrationAPI from '../features/Auth/api/RegistrationAPI';
import { RegisterUserDto } from '../features/Auth/types/Credentials';

export type SafeUserInfo = Omit<RegisterUserDto, 'password'>;

export const registerUser = createAsyncThunk<
  SafeUserInfo,
  RegisterUserDto,
  { rejectValue: string }
>('auth/registerUser', async (credentials, { rejectWithValue }) => {
  try {
    const registrationAPI = container.resolve<RegistrationAPI>('RegistrationAPI');
    const { fullName, email } = await registrationAPI.register(credentials);
    return { fullName, email };
  } catch (err) {
    return rejectWithValue((err as Error).message);
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

export default registrationSlice.reducer;
