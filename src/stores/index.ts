import { configureStore } from '@reduxjs/toolkit';

import loginReducer from '@/modules/User/store/loginSlice';
import registrationReducer from '@/modules/User/store/registrationSlice';

import devToolsOptions from './devToolsOptions';

export const store = configureStore({
  reducer: {
    auth: loginReducer,
    registration: registrationReducer,
  },
  devTools: process.env.NODE_ENV !== 'production' ? devToolsOptions : false,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
