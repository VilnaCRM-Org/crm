import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import ProtectedRoute from '@auth/components/protected-route';
import { AuthStateVar } from '@auth/stores';

function seedToken(token: string | null): void {
  act(() => {
    AuthStateVar.reset();
    AuthStateVar.set({ token });
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
        <Route path="/sign-in" element={<div data-testid="sign-in-page" />} />
        <Route path="/sign-up" element={<div data-testid="sign-up-page" />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  afterEach(() => {
    act(() => {
      AuthStateVar.reset();
    });
  });

  it('redirects to /sign-in (not /sign-up) when token is null', () => {
    renderWithRouter(null);

    expect(screen.getByTestId('sign-in-page')).toBeInTheDocument();
    expect(screen.queryByTestId('sign-up-page')).not.toBeInTheDocument();
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
  });

  it('renders children when token is present', () => {
    renderWithRouter('test-token');

    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('sign-in-page')).not.toBeInTheDocument();
  });
});
