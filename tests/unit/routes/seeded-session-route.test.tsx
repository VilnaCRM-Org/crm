// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import type { ReactElement } from 'react';

import accessState from '@/lib/access/access-state';
import AuthStateVar from '@auth/stores/auth-var';
import { buildToken } from '@tests/builders';
import ROUTER_FUTURE_FLAGS from '@tests/unit/utils/router-future-flags';

// Lighthouse and Playwright authenticate by seeding a token rather than logging in, so
// nothing calls the login path that starts an access session. The real ProtectedRoute
// must hydrate the session itself, otherwise the permission-gated home route paints
// blank and the performance budget collapses. This suite keeps the REAL ProtectedRoute,
// PermissionRoute, composer and access layer in the graph — only the token source and
// the leaf pages are stubbed.
const seededToken = buildToken();

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
  };
});

jest.mock('@/components/layouts/root-layout', () => {
  const { Outlet } = jest.requireActual('react-router-dom');
  return { __esModule: true, default: (): ReactElement => <Outlet /> };
});

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

describe('seeded-session routing (#114 regression guard)', () => {
  // Unmount first: this spec keeps the REAL ProtectedRoute, so resetting the token under a
  // mounted tree redirects to /sign-in and suspends on a chunk the spec never loads.
  afterEach(() => {
    cleanup();
    accessState.clear();
    AuthStateVar.reset();
  });

  it('hydrates the session from the seeded token and renders the gated home page', async () => {
    const actual = jest.requireActual<typeof import('react-router-dom')>('react-router-dom');
    // The seed is the real one Lighthouse and Playwright use: the token in the auth state,
    // read by the token hook AND by the module-load hydration in ProtectedRoute. Stubbing the
    // hook instead would leave that hydration reading a null token, so the pre-render path the
    // suite is named for would never run and dropping it would keep this test green.
    AuthStateVar.set({ token: seededToken });

    const router = jest.requireActual<typeof import('@/routes/routes')>('@/routes/routes').default;

    // Asserted before the first render: hydration must have happened at module load, not from
    // an effect — a layout-effect-only session leaves the gated route blank on the first frame.
    expect(accessState.get().principal).not.toBeNull();

    const memory = actual.createMemoryRouter(router as never, { initialEntries: ['/'] });

    render(
      <Suspense fallback={null}>
        <actual.RouterProvider router={memory} future={ROUTER_FUTURE_FLAGS} />
      </Suspense>
    );

    expect(await screen.findByText('button example page')).toBeInTheDocument();
    expect(accessState.get().principal).not.toBeNull();
  });
});
