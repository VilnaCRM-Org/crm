import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import ProtectedRoute from '@/components/protected-route';
import { loginReducer } from '@/modules/User/store/login-slice';
import { registrationReducer } from '@/modules/User/store/registration-slice';

jest.mock('@/stores', () => ({
  __esModule: true,
  default: {},
}));

const makeStore = (token: string | null): ReturnType<typeof configureStore> =>
  configureStore({
    reducer: { auth: loginReducer, registration: registrationReducer },
    preloadedState: {
      auth: { token, email: '', loading: false, error: null },
    },
  });

const renderWithRouter = (token: string | null): ReturnType<typeof render> =>
  render(
    <Provider store={makeStore(token)}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<div data-testid="dashboard" />} />
          </Route>
          <Route path="/authentication" element={<div data-testid="auth-page" />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );

describe('ProtectedRoute', () => {
  it('redirects to /authentication when token is null', () => {
    renderWithRouter(null);

    expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
  });

  it('renders children when token is present', () => {
    renderWithRouter('test-token');

    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-page')).not.toBeInTheDocument();
  });
});
