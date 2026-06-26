// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';

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
    RouterProvider: ({ router }: { router: unknown }): ReactElement => {
      const mem = actual.createMemoryRouter(router, { initialEntries: [mockCurrentPath] });
      return <actual.RouterProvider router={mem} />;
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

import router from '@/routes/routes';

describe('routes', () => {
  const RouterProvider =
    jest.requireActual<typeof import('react-router-dom')>('react-router-dom').RouterProvider;

  const renderAt = (path: string): void => {
    mockCurrentPath = path;
    const { RouterProvider: MockedRP } = jest.requireMock('react-router-dom');
    render(<MockedRP router={router} />);
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
