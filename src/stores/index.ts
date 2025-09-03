import { configureStore, DevToolsEnhancerOptions, AnyAction } from '@reduxjs/toolkit';

import loginReducer from '@/modules/User/store/loginSlice';
import registrationReducer from '@/modules/User/store/registrationSlice';

const devToolsOptions: DevToolsEnhancerOptions = {
  actionSanitizer: (action) => {
    const meta = (action as AnyAction).meta as unknown;
    if (meta && typeof meta === 'object' && 'arg' in meta) {
      const { arg } = meta as { arg?: unknown };
      if (arg && typeof arg === 'object' && Object.prototype.hasOwnProperty.call(arg, 'password')) {
        return {
          ...action,
          meta: {
            ...(meta as object),
            arg: { ...(arg as Record<string, unknown>), password: '***' },
          },
        };
      }
    }
    return action;
  },
  stateSanitizer: <S>(state: S): S => {
    const typedState = state as unknown as {
      auth?: { token?: string | null };
      registration?: unknown;
    };

    return {
      ...typedState,
      auth: typedState.auth?.token ? { ...typedState.auth, token: '***' } : typedState.auth,
    } as unknown as S;
  },
};

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
