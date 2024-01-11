import { createSlice } from '@reduxjs/toolkit';

import RegistrationAPI from "@/modules/User/features/Auth/api/RegistrationAPI";

const registrationAPI = new RegistrationAPI();

const authSlice = createSlice({
  name: 'Auth',
  initialState: {
    nameAndSurname: '',
    email: '',
    password: '',
  },
  reducers: {
    registerUser(state, action) {
      registrationAPI.register(action.payload);
    }
  }
});

export const { registerUser } = authSlice.actions;

export default authSlice.reducer;
