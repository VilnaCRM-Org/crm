import { configureStore } from '@reduxjs/toolkit';

import container from '@/config/DependencyInjectionConfig';
import LoginAPI from '@/modules/User/features/Auth/api/LoginAPI';
import RegistrationAPI from '@/modules/User/features/Auth/api/RegistrationAPI';
import loginReducer from '@/modules/User/store/loginSlice';
import registrationReducer from '@/modules/User/store/registrationSlice';

export const store = configureStore({
  reducer: {
    auth: loginReducer,
    register: registrationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: {
        extraArgument: {
          loginAPI: container.resolve<LoginAPI>('LoginAPI'),
          registrationAPI: container.resolve<RegistrationAPI>('RegistrationAPI'),
        },
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
