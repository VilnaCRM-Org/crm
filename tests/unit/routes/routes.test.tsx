// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import type { ReactElement } from 'react';

import router, { onRouteError } from '@/routes/routes';
import boundaryErrorReporter from '@/services/error-reporting/boundary-error-reporter';
import { buildToken } from '@tests/builders';

let mockCurrentPath = '/sign-up';
let mockPageError: Error | undefined;

jest.mock('react-i18next', () => ({
  useTranslation: (): { i18n: { language: string }; t: (k: string) => string } => ({
    i18n: { language: 'en' },
    t: (k: string): string => k,
  }),
}));

jest.mock('react-router', () => {
  const actual = jest.requireActual('react-router');
  return {
    __esModule: true,
    ...actual,
    createBrowserRouter: (routes: unknown): unknown => routes,
    RouterProvider: ({
      router,
      future,
      onError,
    }: {
      router: unknown;
      future?: unknown;
      onError?: unknown;
    }): ReactElement => {
      const mem = actual.createMemoryRouter(router, { initialEntries: [mockCurrentPath] });
      return <actual.RouterProvider router={mem} future={future} onError={onError} />;
    },
  };
});

jest.mock('@auth/components/protected-route', () => {
  const { Outlet } = jest.requireActual('react-router');
  return { __esModule: true, default: (): ReactElement => <Outlet /> };
});

jest.mock('@/components/layouts/root-layout', () => {
  const { Outlet } = jest.requireActual('react-router');
  return { __esModule: true, default: (): ReactElement => <Outlet /> };
});

jest.mock('@/components/layouts/app-layout', () => {
  const { Outlet } = jest.requireActual('react-router');
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
  default: (): ReactElement => {
    if (mockPageError) {
      throw mockPageError;
    }
    return <div>button example page</div>;
  },
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
  const RouterProvider =
    jest.requireActual<typeof import('react-router')>('react-router').RouterProvider;

  type RenderAtOptions = { onCaughtError?: jest.Mock; onError?: typeof onRouteError };

  const renderAt = (path: string, { onCaughtError, onError }: RenderAtOptions = {}): void => {
    mockCurrentPath = path;
    const { RouterProvider: MockedRP } = jest.requireMock('react-router');
    render(
      <Suspense fallback={null}>
        <MockedRP router={router} onError={onError} />
      </Suspense>,
      { onCaughtError }
    );
  };

  afterEach(() => {
    mockPageError = undefined;
    jest.restoreAllMocks();
  });

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

  it('renders the route error boundary inside AppLayout when a page throws (#116)', async () => {
    mockPageError = new Error(buildToken());
    const onCaughtError = jest.fn();
    const report = jest.spyOn(boundaryErrorReporter, 'report').mockImplementation(() => undefined);

    renderAt('/', { onCaughtError, onError: onRouteError });

    expect(await screen.findByText('route error')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.queryByText('button example page')).not.toBeInTheDocument();
    expect(onCaughtError).toHaveBeenCalledTimes(1);
    expect(onCaughtError.mock.calls[0]?.[0]).toBe(mockPageError);
    // The exported onRouteError is the composer's handler: the page error reaches the boundary
    // reporter on the route surface with the matched pattern and the React component stack.
    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith(mockPageError, {
      componentStack: expect.any(String),
      surface: 'route',
      pattern: '/',
    });
  });
});
