import { configureStore } from '@reduxjs/toolkit';

import loginReducer from '@/modules/User/store/loginSlice';
import registrationReducer from '@/modules/User/store/registrationSlice';

export const store = configureStore({
  reducer: {
    auth: loginReducer,
    registration: registrationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
