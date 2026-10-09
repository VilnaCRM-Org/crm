import { act, render, screen } from '@testing-library/react';
import type { JSX } from 'react';
import { MemoryRouter, Route, Routes, useLocation, useOutletContext } from 'react-router';

import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import type { RedirectNavigationState } from '@/routes/types/navigation-state';
import type { ProtectedOutletContext } from '@/routes/types/protected-outlet-context';
import observabilityCore from '@/services/observability/observability-core';
import ProtectedRoute from '@auth/components/protected-route';
import { useAuthStore, authActions } from '@auth/stores';
import { buildToken } from '@tests/builders';
import { resetClientStores } from '@tests/utils/reset-client-stores';

function seedToken(token: string | null): void {
  act(() => {
    resetClientStores();
    useAuthStore.setState({ token });
  });
}

function SignInProbe(): JSX.Element {
  const location = useLocation();
  const state = location.state as RedirectNavigationState | null;
  const from = state?.from;
  const target = from ? `${from.pathname}${from.search}${from.hash}` : 'none';
  return (
    <div>
      <p>sign in page from:{target}</p>
      <p>focus main:{String(state?.focusMain)}</p>
    </div>
  );
}

function DashboardProbe(): JSX.Element {
  const { signOut } = useOutletContext<ProtectedOutletContext>();
  return (
    <div>
      <p>dashboard</p>
      <button type="button" onClick={signOut}>
        sign out
      </button>
    </div>
  );
}

const renderWithRouter = (token: string | null, initialEntry = '/'): ReturnType<typeof render> => {
  seedToken(token);
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardProbe />} />
        </Route>
        <Route path="/sign-in" element={<SignInProbe />} />
        <Route path="/sign-up" element={<div>sign up page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

const clickSignOut = async (): Promise<void> => {
  const button = screen.getByRole('button', { name: 'sign out' });
  await act(async () => {
    button.click();
  });
};

describe('ProtectedRoute', () => {
  afterEach(() => {
    act(() => {
      resetClientStores();
    });
    jest.restoreAllMocks();
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

  it('does not ask the sign-in page to focus main for an unauthenticated visit', () => {
    renderWithRouter(null);

    expect(screen.getByText('focus main:false')).toBeInTheDocument();
  });

  it('renders children when token is present', () => {
    renderWithRouter(buildToken());

    expect(screen.getByText('dashboard')).toBeInTheDocument();
    expect(screen.queryByText(/sign in page/)).not.toBeInTheDocument();
  });

  it('signs out through the auth store singleton and hands focus to /sign-in', async () => {
    const logout = jest.spyOn(authActions, 'logout');
    renderWithRouter(buildToken());

    await clickSignOut();

    expect(await screen.findByText('sign in page from:/')).toBeInTheDocument();
    expect(screen.getByText('focus main:true')).toBeInTheDocument();
    expect(logout).toHaveBeenCalledTimes(1);
    expect(logout.mock.contexts[0]).toBe(authActions);
    expect(useAuthStore.getState().token).toBeNull();
    expect(screen.queryByText('dashboard')).not.toBeInTheDocument();
  });

  it('reports a failed sign-out load and keeps the protected page usable', async () => {
    const error = new Error(buildToken());
    const load = jest.spyOn(ChunkRetryLoader.prototype, 'load').mockRejectedValueOnce(error);
    const captureError = jest
      .spyOn(observabilityCore, 'captureError')
      .mockImplementation(() => undefined);
    const logout = jest.spyOn(authActions, 'logout');
    renderWithRouter(buildToken());

    await clickSignOut();

    expect(load).toHaveBeenCalledTimes(1);
    expect(captureError).toHaveBeenCalledTimes(1);
    expect(captureError).toHaveBeenCalledWith(error, { source: 'auth:sign-out' });
    expect(logout).not.toHaveBeenCalled();
    expect(screen.getByText('dashboard')).toBeInTheDocument();

    await clickSignOut();

    expect(await screen.findByText('sign in page from:/')).toBeInTheDocument();
    expect(screen.getByText('focus main:true')).toBeInTheDocument();
    expect(logout).toHaveBeenCalledTimes(1);
    expect(captureError).toHaveBeenCalledTimes(1);
  });

  it('forgets the sign-out intent after a failed load', async () => {
    jest.spyOn(ChunkRetryLoader.prototype, 'load').mockRejectedValueOnce(new Error(buildToken()));
    jest.spyOn(observabilityCore, 'captureError').mockImplementation(() => undefined);
    renderWithRouter(buildToken());

    await clickSignOut();

    act(() => {
      resetClientStores();
    });

    expect(screen.getByText('sign in page from:/')).toBeInTheDocument();
    expect(screen.getByText('focus main:false')).toBeInTheDocument();
  });
});
