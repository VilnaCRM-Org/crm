import { configureStore } from '@reduxjs/toolkit';

import container from '@/config/DependencyInjectionConfig';
import TOKENS from '@/config/tokens';
import type LoginAPI from '@/modules/User/features/Auth/api/LoginAPI';
import { loginReducer } from '@/modules/User/store';
import type { ThunkExtra } from '@/modules/User/store/types';
import devToolsOptions from '@/stores/devToolsOptions';

const thunkExtraArgument: ThunkExtra = {
  loginAPI: container.resolve<LoginAPI>(TOKENS.LoginAPI),
};

export const store = configureStore({
  reducer: {
    auth: loginReducer,
  },
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
