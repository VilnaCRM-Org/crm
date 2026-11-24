import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type JSX, Suspense, useCallback } from 'react';
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
  useLocation,
  useOutletContext,
} from 'react-router';

import AppLayout from '@/components/layouts/app-layout';
import type { AppLayoutProps } from '@/components/types/layouts/app-layout';
import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import pageReloadNavigator from '@/lib/reliability/page-reload-navigator';
import * as protectedLayoutChunk from '@/routes/protected-layout';
import protectedLayoutLoader from '@/routes/protected-layout-loader';
import ShellSlotFactory from '@/routes/shell-slot-factory';
import type { RedirectNavigationState } from '@/routes/types/navigation-state';
import type { ProtectedLayoutModule } from '@/routes/types/protected-layout';
import type { ProtectedSessionContext } from '@/routes/types/protected-outlet-context';
import type { ShellSlotProps } from '@/routes/types/shell-slot';
import ProtectedRoute from '@auth/components/protected-route';
import { useAuthStore } from '@auth/stores';
import authSessionProvider from '@auth/stores/auth-session-provider';
import { buildToken } from '@tests/builders';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const chunkFailure = (): Error =>
  Object.assign(new Error('Loading chunk protected-layout failed.'), { name: 'ChunkLoadError' });

function seedToken(token: string | null): void {
  act(() => {
    resetClientStores();
    useAuthStore.setState({ token });
  });
}

function SignInProbe(): JSX.Element {
  const state = useLocation().state as RedirectNavigationState | null;

  return <p>sign in from:{state?.from?.pathname ?? 'none'}</p>;
}

let lastContext: ProtectedSessionContext | null = null;

function DashboardProbe(): JSX.Element {
  lastContext = useOutletContext<ProtectedSessionContext>();

  return <p>dashboard</p>;
}

function GuardStub(): JSX.Element {
  return (
    <>
      <p>guard stub</p>
      <Outlet />
    </>
  );
}

function LayoutStub({ userMenu, onShellFailure }: AppLayoutProps): JSX.Element {
  return (
    <p>
      layout stub menu:{String(userMenu !== undefined)} failure:
      {String(onShellFailure !== undefined)}
    </p>
  );
}

const stubModule: ProtectedLayoutModule = {
  ProtectedRoute: GuardStub,
  AppLayout: LayoutStub,
  ShellSlotFactory,
};

function LoadedSlot({ signOut, onChunkFailure }: ShellSlotProps): JSX.Element {
  const failInner = useCallback(
    () => onChunkFailure('app-shell:current-user', 'inner'),
    [onChunkFailure]
  );

  return (
    <>
      <button type="button" onClick={signOut}>
        sign out
      </button>
      <button type="button" onClick={failInner}>
        fail inner
      </button>
    </>
  );
}

describe('ProtectedLayoutLoader', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    lastContext = null;
  });

  it('serves the guard, the layout and the slot factory from one chunk module', () => {
    expect(protectedLayoutChunk.ProtectedRoute).toBe(ProtectedRoute);
    expect(protectedLayoutChunk.AppLayout).toBe(AppLayout);
    expect(protectedLayoutChunk.ShellSlotFactory).toBe(ShellSlotFactory);
  });

  it('redirects a signed-out visit to /sign-in with state.from via the lazy guard', async () => {
    seedToken(null);
    const layout = protectedLayoutLoader.create({ report: jest.fn() });
    const router = createMemoryRouter(
      [
        {
          element: <layout.ProtectedRoute />,
          children: [{ path: '/dashboard', element: <DashboardProbe /> }],
        },
        { path: '/sign-in', element: <SignInProbe /> },
      ],
      { initialEntries: ['/dashboard'] }
    );

    render(
      <Suspense fallback={<p>pending</p>}>
        <RouterProvider router={router} />
      </Suspense>
    );

    expect(await screen.findByText('sign in from:/dashboard')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/sign-in');
  });

  it('renders a signed-in visit with the { signOut, session } outlet context', async () => {
    seedToken(buildToken());
    const layout = protectedLayoutLoader.create({ report: jest.fn() });
    const router = createMemoryRouter(
      [
        {
          element: <layout.ProtectedRoute />,
          children: [{ path: '/', element: <DashboardProbe /> }],
        },
      ],
      { initialEntries: ['/'] }
    );

    render(
      <Suspense fallback={<p>pending</p>}>
        <RouterProvider router={router} />
      </Suspense>
    );

    expect(await screen.findByText('dashboard')).toBeInTheDocument();
    expect(lastContext?.session).toBe(authSessionProvider);
    expect(lastContext?.signOut).toEqual(expect.any(Function));
  });

  it('resolves the guard and the layout through one shared chunk load', async () => {
    const load = jest.spyOn(ChunkRetryLoader.prototype, 'load').mockResolvedValue(stubModule);
    const report = jest.fn();
    const onShellFailure = jest.fn();
    const layout = protectedLayoutLoader.create({ report });
    const router = createMemoryRouter(
      [
        {
          element: <layout.ProtectedRoute />,
          children: [{ path: '/', element: <layout.AppLayout onShellFailure={onShellFailure} /> }],
        },
      ],
      { initialEntries: ['/'] }
    );

    render(
      <Suspense fallback={<p>pending</p>}>
        <RouterProvider router={router} />
      </Suspense>
    );

    expect(await screen.findByText('guard stub')).toBeInTheDocument();
    expect(await screen.findByText('layout stub menu:false failure:true')).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
    expect(load.mock.contexts[0]).toBeInstanceOf(ChunkRetryLoader);
    expect(load.mock.contexts[1]).toBe(load.mock.contexts[0]);
  });

  it('gives each composition its own chunk loader', async () => {
    const load = jest.spyOn(ChunkRetryLoader.prototype, 'load').mockResolvedValue(stubModule);
    const first = protectedLayoutLoader.create({ report: jest.fn() });
    const second = protectedLayoutLoader.create({ report: jest.fn() });

    render(
      <Suspense fallback={<p>pending</p>}>
        <first.AppLayout />
        <second.AppLayout />
      </Suspense>
    );

    expect(await screen.findAllByText('layout stub menu:false failure:false')).toHaveLength(2);
    expect(load).toHaveBeenCalledTimes(2);
    expect(load.mock.contexts[1]).not.toBe(load.mock.contexts[0]);
  });

  it('sends a failed load to the route errorElement without reloading the page', async () => {
    const failure = chunkFailure();
    jest.spyOn(ChunkRetryLoader.prototype, 'load').mockRejectedValue(failure);
    const reload = jest.spyOn(pageReloadNavigator, 'reload').mockImplementation(() => undefined);
    const onCaughtError = jest.fn();
    const onError = jest.fn();
    const layout = protectedLayoutLoader.create({ report: jest.fn() });
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <layout.ProtectedRoute />,
          errorElement: <p>route failed</p>,
        },
      ],
      { initialEntries: ['/'] }
    );

    render(
      <Suspense fallback={<p>pending</p>}>
        <RouterProvider router={router} onError={onError} />
      </Suspense>,
      { onCaughtError }
    );

    expect(await screen.findByText('route failed')).toBeInTheDocument();
    expect(onCaughtError).toHaveBeenCalledWith(failure, expect.anything());
    expect(onError).toHaveBeenCalledWith(failure, expect.anything());
    expect(reload).not.toHaveBeenCalled();
  });

  it('returns no user-menu slot when no module declares one', () => {
    const layout = protectedLayoutLoader.create({ userMenu: undefined, report: jest.fn() });

    expect(layout).not.toHaveProperty('userMenu');
  });

  it('builds the user-menu slot from the chunk and reports its failures', async () => {
    const report = jest.fn();
    const signOut = jest.fn();
    const { userMenu: Slot } = protectedLayoutLoader.create({
      userMenu: () => Promise.resolve({ default: LoadedSlot }),
      report,
    });
    if (Slot === undefined) throw new Error('expected a user-menu slot');
    const user = userEvent.setup();

    render(
      <Suspense fallback={<p>pending</p>}>
        <Slot signOut={signOut} onAvatar={jest.fn()} />
      </Suspense>
    );
    await user.click(await screen.findByRole('button', { name: 'sign out' }));
    await user.click(screen.getByRole('button', { name: 'fail inner' }));

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith('app-shell:current-user', 'inner');
  });

  it('reports a user-menu chunk that fails with the user-menu source', async () => {
    const report = jest.fn();
    const failure = new Error(buildToken());
    const { userMenu: Slot } = protectedLayoutLoader.create({
      userMenu: () => Promise.reject(failure),
      report,
    });
    if (Slot === undefined) throw new Error('expected a user-menu slot');

    render(
      <Suspense fallback={<p>pending</p>}>
        <Slot signOut={jest.fn()} onAvatar={jest.fn()} />
      </Suspense>
    );

    await waitFor(() => expect(report).toHaveBeenCalledTimes(1));
    expect(report).toHaveBeenCalledWith('app-shell:user-menu', failure);
  });
});
