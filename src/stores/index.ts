import { configureStore } from '@reduxjs/toolkit';

import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import { loginReducer, registrationReducer } from '@/modules/user/store';
import type {
  LoginAPIContract,
  RegistrationAPIContract,
  ThunkExtra,
} from '@/modules/user/store/types';

import devToolsOptions from './dev-tools-options';
import { getPreloadedAuthToken } from './preloaded-auth-token';

const thunkExtraArgument: ThunkExtra = {
  loginAPI: container.resolve<LoginAPIContract>(TOKENS.LoginAPI),
  registrationAPI: container.resolve<RegistrationAPIContract>(TOKENS.RegistrationAPI),
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
