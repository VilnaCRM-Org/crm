import { configureStore } from '@reduxjs/toolkit';

import AuthReducer from '../modules/User/store';

const store = configureStore({
  reducer: {
    Auth: AuthReducer,
  },
});

export type AppDispatch = typeof store.dispatch;

export default store;
