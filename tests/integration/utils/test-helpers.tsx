/* eslint-disable import/no-self-import, import/no-relative-packages, import/order */
import React from 'react';
import { combineReducers, configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { render, RenderOptions } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import i18n from '@/i18n';
import type { IUserRepository } from '@/modules/user/features/auth/repositories';
import { loginReducer } from '@/modules/user/store';
import type { ThunkExtra } from '@/modules/user/store/types';
import type { RootState } from '@/stores';

type TestRootState = {
  auth: ReturnType<typeof loginReducer>;
};

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: Partial<RootState>;
  store?: EnhancedStore<TestRootState>;
}

const rootReducer = combineReducers({
  auth: loginReducer,
});

type RenderWithProvidersResult = ReturnType<typeof render> & {
  store: EnhancedStore<TestRootState>;
};

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState,
    store = configureStore({
      reducer: rootReducer,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          thunk: {
            extraArgument: {
              userRepository: container.resolve<IUserRepository>(TOKENS.UserRepository),
            } as ThunkExtra,
          },
        }),
      preloadedState: preloadedState as never,
    }),
    ...renderOptions
  }: ExtendedRenderOptions = {}
): RenderWithProvidersResult {
  function Wrapper({ children }: { children: React.ReactNode }): JSX.Element {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <I18nextProvider i18n={i18n as never}>{children}</I18nextProvider>
        </BrowserRouter>
      </Provider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    store,
  } as RenderWithProvidersResult;
}

export { screen, waitFor, within } from '@testing-library/react';
