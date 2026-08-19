// @jest-environment jsdom

import './utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';

let mockCurrentPath = '/sign-up';

jest.mock('../../src/index.css', () => ({}));

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
    RouterProvider: ({ router }: { router: unknown }): ReactElement => {
      const memoryRouter = actual.createMemoryRouter(router, { initialEntries: [mockCurrentPath] });
      return <actual.RouterProvider router={memoryRouter} />;
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
  return { __esModule: true, default: (): ReactElement => <Outlet /> };
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

const App = jest.requireActual<typeof import('@/app')>('@/app').default;

describe('App', () => {
  beforeEach(() => {
    mockCurrentPath = '/sign-up';
  });

  it('renders the /sign-up page via RouterProvider (AC1)', async () => {
    render(<App />);
    expect(await screen.findByText('sign up page')).toBeInTheDocument();
  });

  it('renders the /sign-in page via RouterProvider (AC1)', async () => {
    mockCurrentPath = '/sign-in';
    render(<App />);
    expect(await screen.findByText('sign in page')).toBeInTheDocument();
  });

  it('renders NotFound at an unknown path (AC2)', async () => {
    mockCurrentPath = '/unknown-path';
    render(<App />);
    expect(await screen.findByText('not found page')).toBeInTheDocument();
  });
});
