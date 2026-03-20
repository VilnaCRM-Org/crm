import { configureStore } from '@reduxjs/toolkit';

import { createAuthClients } from '@/modules/user/features/auth/repositories';
import { loginReducer, registrationReducer } from '@/modules/user/store';
import type { ThunkExtra } from '@/modules/user/store/types';

import devToolsOptions from './dev-tools-options';
import { getPreloadedAuthToken } from './preloaded-auth-token';

const thunkExtraArgument: ThunkExtra = createAuthClients();

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
