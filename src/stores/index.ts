import { configureStore } from '@reduxjs/toolkit';

import createAuthClients from '@/modules/User/features/Auth/runtime/create-auth-clients';
import { loginReducer, registrationReducer } from '@/modules/User/store';
import type { ThunkExtra } from '@/modules/User/store/types';
import { getPreloadedAuthToken } from '@/stores/preloaded-auth-token';

import devToolsOptions from './devToolsOptions';

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
