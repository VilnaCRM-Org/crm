import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import type { RedirectNavigationState } from '@/routes/types/navigation-state';
import ProtectedRoute from '@auth/components/protected-route';
import { AuthStateVar } from '@auth/stores';
import ROUTER_FUTURE_FLAGS from '@tests/unit/utils/router-future-flags';

function seedToken(token: string | null): void {
  act(() => {
    AuthStateVar.reset();
    AuthStateVar.set({ token });
  });
}

function SignInProbe(): JSX.Element {
  const location = useLocation();
  const from = (location.state as RedirectNavigationState | null)?.from;
  const target = from ? `${from.pathname}${from.search}${from.hash}` : 'none';
  return <div>sign in page from:{target}</div>;
}

const renderWithRouter = (token: string | null, initialEntry = '/'): ReturnType<typeof render> => {
  seedToken(token);
  return render(
    <MemoryRouter initialEntries={[initialEntry]} future={ROUTER_FUTURE_FLAGS}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>dashboard</div>} />
        </Route>
        <Route path="/sign-in" element={<SignInProbe />} />
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

    expect(screen.getByText(/sign in page/)).toBeInTheDocument();
    expect(screen.queryByText('sign up page')).not.toBeInTheDocument();
    expect(screen.queryByText('dashboard')).not.toBeInTheDocument();
  });

  it('preserves the intended location in the redirect state (issue #150)', () => {
    renderWithRouter(null, '/?tab=deals#activity');

    expect(screen.getByText('sign in page from:/?tab=deals#activity')).toBeInTheDocument();
  });

  it('renders children when token is present', () => {
    renderWithRouter('test-token');

    expect(screen.getByText('dashboard')).toBeInTheDocument();
    expect(screen.queryByText(/sign in page/)).not.toBeInTheDocument();
  });
});
