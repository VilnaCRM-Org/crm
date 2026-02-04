import { configureStore } from '@reduxjs/toolkit';

import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import type { IUserRepository } from '@/modules/user/features/auth/repositories';
import { loginReducer } from '@/modules/user/store';
import type { ThunkExtra } from '@/modules/user/store/types';
import devToolsOptions from '@/stores/dev-tools-options';

const thunkExtraArgument: ThunkExtra = {
  userRepository: container.resolve<IUserRepository>(TOKENS.UserRepository),
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
