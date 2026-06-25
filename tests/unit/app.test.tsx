// @jest-environment jsdom

import './utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';

type MockI18n = {
  language: string;
  dir?: (language: string) => 'ltr' | 'rtl';
  on?: (event: string, callback: () => void) => void;
  off?: (event: string, callback: () => void) => void;
};

let mockI18n: MockI18n = {
  language: 'en',
};

let mockCurrentPath = '/sign-up';
let languageChangedHandler: (() => void) | undefined;

jest.mock('../../src/index.css', () => ({}));

jest.mock('react-i18next', () => ({
  useTranslation: (): { i18n: MockI18n } => ({ i18n: mockI18n }),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');

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
  const { Outlet } = jest.requireActual('react-router-dom');

  return {
    __esModule: true,
    default: (): ReactElement => <Outlet />,
  };
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

const App = jest.requireActual<typeof import('@/app')>('@/app').default;

describe('App', () => {
  beforeEach(() => {
    languageChangedHandler = undefined;
    mockI18n = { language: 'en' };
    mockCurrentPath = '/sign-up';
    document.documentElement.dir = '';
    document.documentElement.lang = '';
  });

  it('renders the /sign-up page', async () => {
    mockCurrentPath = '/sign-up';

    render(<App />);

    expect(await screen.findByText('sign up page')).toBeInTheDocument();
  });

  it('renders the /sign-in page', async () => {
    mockCurrentPath = '/sign-in';

    render(<App />);

    expect(await screen.findByText('sign in page')).toBeInTheDocument();
  });

  it('renders no auth page at the removed /authentication route', async () => {
    mockCurrentPath = '/authentication';

    render(<App />);

    await waitFor(() => expect(document.documentElement.dir).toBe('ltr'));
    expect(screen.queryByText('sign up page')).not.toBeInTheDocument();
    expect(screen.queryByText('sign in page')).not.toBeInTheDocument();
  });

  it('falls back to ltr when i18n.dir is unavailable', async () => {
    mockI18n = { language: 'en' };

    render(<App />);

    expect(await screen.findByText('sign up page')).toBeInTheDocument();
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('subscribes to language changes and updates direction', async () => {
    const on = jest.fn((event: string, callback: () => void) => {
      if (event === 'languageChanged') {
        languageChangedHandler = callback;
      }
    });
    const off = jest.fn();

    mockI18n = {
      language: 'ar',
      dir: (language: string): 'ltr' | 'rtl' => (language === 'ar' ? 'rtl' : 'ltr'),
      on,
      off,
    };

    const view = render(<App />);

    expect(await screen.findByText('sign up page')).toBeInTheDocument();
    expect(document.documentElement.dir).toBe('rtl');
    expect(on).toHaveBeenCalledWith('languageChanged', expect.any(Function));

    mockI18n.language = 'en';
    languageChangedHandler?.();

    await waitFor(() => {
      expect(document.documentElement.dir).toBe('ltr');
    });

    view.unmount();

    expect(off).toHaveBeenCalledWith('languageChanged', expect.any(Function));
  });
});
