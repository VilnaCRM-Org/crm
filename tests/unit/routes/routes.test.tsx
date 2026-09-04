// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import type { ReactElement } from 'react';

import accessState from '@/lib/access/access-state';
import router from '@/routes/routes';
import { buildPrincipal } from '@tests/builders';
import ROUTER_FUTURE_FLAGS from '@tests/unit/utils/router-future-flags';

let mockCurrentPath = '/sign-up';

jest.mock('react-i18next', () => ({
  useTranslation: (): { i18n: { language: string }; t: (k: string) => string } => ({
    i18n: { language: 'en' },
    t: (k: string): string => k,
  }),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    createBrowserRouter: (routes: unknown): unknown => routes,
    RouterProvider: ({ router, future }: { router: unknown; future?: unknown }): ReactElement => {
      const mem = actual.createMemoryRouter(router, { initialEntries: [mockCurrentPath] });
      return <actual.RouterProvider router={mem} future={future} />;
    },
  };
});

jest.mock('@auth/components/protected-route', () => {
  const { Outlet } = jest.requireActual('react-router-dom');
  return { __esModule: true, default: (): ReactElement => <Outlet /> };
});

jest.mock('@/components/layouts/root-layout', () => {
  const { Outlet } = jest.requireActual('react-router-dom');
  return { __esModule: true, default: (): ReactElement => <Outlet /> };
});

jest.mock('@/components/layouts/app-layout', () => {
  const { Outlet } = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    default: (): ReactElement => (
      <main>
        <Outlet />
      </main>
    ),
  };
});

jest.mock('@/components/error-boundary/route-error', () => ({
  __esModule: true,
  default: (): ReactElement => <div>route error</div>,
}));

jest.mock('@/components/not-found/not-found', () => ({
  __esModule: true,
  default: (): ReactElement => <div>not found page</div>,
}));

jest.mock('@/button-example', () => ({
  __esModule: true,
  default: (): ReactElement => <div>button example page</div>,
}));

jest.mock('@auth/routes/sign-up', () => ({
  __esModule: true,
  default: (): ReactElement => <div>sign up page</div>,
}));

jest.mock('@auth/routes/sign-in', () => ({
  __esModule: true,
  default: (): ReactElement => <div>sign in page</div>,
}));

describe('routes', () => {
  // The home route is permission-gated (#114) and ProtectedRoute — which hydrates the
  // access session from the token — is mocked out here, so seed the principal directly.
  beforeEach(() => accessState.setSession(buildPrincipal(), {}));
  // The router tree is still mounted here, so clearing the store notifies the gate's
  // subscription: wrapped in act(...) the teardown stays a real React update.
  afterEach(() => {
    act(() => {
      accessState.clear();
    });
  });

  const RouterProvider =
    jest.requireActual<typeof import('react-router-dom')>('react-router-dom').RouterProvider;

  const renderAt = (path: string): void => {
    mockCurrentPath = path;
    const { RouterProvider: MockedRP } = jest.requireMock('react-router-dom');
    render(
      <Suspense fallback={null}>
        <MockedRP router={router} future={ROUTER_FUTURE_FLAGS} />
      </Suspense>
    );
  };

  it('renders SignUp at /sign-up (AC1)', async () => {
    renderAt('/sign-up');
    expect(await screen.findByText('sign up page')).toBeInTheDocument();
    void RouterProvider;
  });

  it('renders SignIn at /sign-in (AC1)', async () => {
    renderAt('/sign-in');
    expect(await screen.findByText('sign in page')).toBeInTheDocument();
  });

  it('renders NotFound on unknown path (AC2)', async () => {
    renderAt('/does-not-exist');
    expect(await screen.findByText('not found page')).toBeInTheDocument();
  });

  it('renders ButtonExample through AppLayout at / (AC1)', async () => {
    renderAt('/');
    expect(await screen.findByText('button example page')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
