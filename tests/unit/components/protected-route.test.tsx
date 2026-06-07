import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import ProtectedRoute from '@auth/components/protected-route';
import { useAuthStore } from '@auth/stores';

function seedToken(token: string | null): void {
  act(() => {
    useAuthStore.getState().reset();
    useAuthStore.setState({ token });
  });
}

const renderWithRouter = (token: string | null): ReturnType<typeof render> => {
  seedToken(token);
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div data-testid="dashboard" />} />
        </Route>
        <Route path="/authentication" element={<div data-testid="auth-page" />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  afterEach(() => {
    act(() => {
      useAuthStore.getState().reset();
    });
  });

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
