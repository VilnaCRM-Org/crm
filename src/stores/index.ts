import { configureStore } from '@reduxjs/toolkit';

import { loginReducer, registrationReducer } from '@/modules/User/store';

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
