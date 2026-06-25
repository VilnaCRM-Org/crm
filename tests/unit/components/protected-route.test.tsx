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
          <Route path="/" element={<div>dashboard</div>} />
        </Route>
        <Route path="/sign-in" element={<div>sign in page</div>} />
        <Route path="/sign-up" element={<div>sign up page</div>} />
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

    expect(screen.getByText('sign in page')).toBeInTheDocument();
    expect(screen.queryByText('sign up page')).not.toBeInTheDocument();
    expect(screen.queryByText('dashboard')).not.toBeInTheDocument();
  });

  it('renders children when token is present', () => {
    renderWithRouter('test-token');

    expect(screen.getByText('dashboard')).toBeInTheDocument();
    expect(screen.queryByText('sign in page')).not.toBeInTheDocument();
  });
});
