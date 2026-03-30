import { configureStore } from '@reduxjs/toolkit';

import container from '@/config/DependencyInjectionConfig';
import TOKENS from '@/config/tokens';
import type LoginAPI from '@/modules/User/features/Auth/api/LoginAPI';
import type RegistrationAPI from '@/modules/User/features/Auth/api/RegistrationAPI';
import { loginReducer, registrationReducer } from '@/modules/User/store';
import type { ThunkExtra } from '@/modules/User/store/types';

import devToolsOptions from './devToolsOptions';
import { getPreloadedAuthToken } from './preloaded-auth-token';

const thunkExtraArgument: ThunkExtra = {
  loginAPI: container.resolve<LoginAPI>(TOKENS.LoginAPI),
  registrationAPI: container.resolve<RegistrationAPI>(TOKENS.RegistrationAPI),
};

const preloadedToken = getPreloadedAuthToken();

export const store = configureStore({
  reducer: {
    auth: loginReducer,
    registration: registrationReducer,
  },
  preloadedState: preloadedToken
    ? { auth: { token: preloadedToken, email: '', loading: false, error: null } }
    : undefined,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: {
        extraArgument: thunkExtraArgument,
      },
    }),
  devTools: process.env.NODE_ENV !== 'production' ? devToolsOptions : false,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
