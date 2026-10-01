import './utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { JSX } from 'react';

type MockI18n = {
  language: string;
  dir?: (language: string) => 'ltr' | 'rtl';
  on?: (event: string, callback: () => void) => void;
  off?: (event: string, callback: () => void) => void;
};

const mockI18n: MockI18n = {
  language: 'en',
};

window.history.pushState({}, '', '/');

jest.mock('../../src/index.css', () => ({}));

jest.mock('react-i18next', () => ({
  useTranslation: (): { i18n: MockI18n; t: (k: string) => string } => ({
    i18n: mockI18n,
    t: (k: string): string => k,
  }),
}));

jest.mock('@auth/components/protected-route', () => {
  const { Outlet } = jest.requireActual('react-router');
  return { __esModule: true, default: (): JSX.Element => <Outlet /> };
});

jest.mock('@/components/layouts/root-layout', () => {
  const { Outlet } = jest.requireActual('react-router');
  return { __esModule: true, default: (): JSX.Element => <Outlet /> };
});

jest.mock('@/components/layouts/app-layout', () => {
  const { Outlet } = jest.requireActual('react-router');
  return { __esModule: true, default: (): JSX.Element => <Outlet /> };
});

jest.mock('@/components/error-boundary/route-error', () => ({
  __esModule: true,
  default: (): JSX.Element => <div>route error</div>,
}));

jest.mock('@/components/not-found/not-found', () => ({
  __esModule: true,
  default: (): JSX.Element => <div>not found page</div>,
}));

jest.mock('@/components/forbidden/forbidden', () => ({
  __esModule: true,
  default: (): JSX.Element => <div>forbidden page</div>,
}));

jest.mock('@/components/server-error/server-error', () => ({
  __esModule: true,
  default: (): JSX.Element => <div>server error page</div>,
}));

jest.mock('@/features/home', () => ({
  __esModule: true,
  default: (): JSX.Element => <div>home page</div>,
}));

jest.mock('@auth/routes/sign-up', () => ({
  __esModule: true,
  default: (): JSX.Element => <div>sign up page</div>,
}));

jest.mock('@auth/routes/sign-in', () => ({
  __esModule: true,
  default: (): JSX.Element => <div>sign in page</div>,
}));

const App = jest.requireActual<typeof import('@/app')>('@/app').default;

describe('App root route', () => {
  it('renders the home page through the protected outlet', async () => {
    render(<App />);

    expect(await screen.findByText('home page')).toBeInTheDocument();
  });
});
