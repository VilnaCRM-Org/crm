// @jest-environment jsdom

import './utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { Request as NodeFetchRequest } from 'node-fetch';

type MockI18n = {
  language: string;
  dir?: (language: string) => 'ltr' | 'rtl';
  on?: (event: string, callback: () => void) => void;
  off?: (event: string, callback: () => void) => void;
};

let mockI18n: MockI18n = {
  language: 'en',
};

let languageChangedHandler: (() => void) | undefined;

const mockStore = {
  getState: (): { auth: { token: string | null } } => ({
    auth: { token: 'token' },
  }),
  subscribe: (): (() => void) => () => undefined,
  dispatch: (): void => undefined,
};

window.history.pushState({}, '', '/authentication');

if (typeof Request === 'undefined') {
  // React Router expects the Fetch API request primitive during router setup.
  globalThis.Request = NodeFetchRequest as unknown as typeof Request;
}

jest.mock('../../src/index.css', () => ({}));

jest.mock('react-i18next', () => ({
  useTranslation: (): { i18n: MockI18n } => ({ i18n: mockI18n }),
}));

jest.mock('@/stores', () => ({
  __esModule: true,
  default: mockStore,
}));

jest.mock('@/components/protected-route', () => {
  const { Outlet } = jest.requireActual('react-router-dom');

  return {
    __esModule: true,
    default: (): JSX.Element => <Outlet />,
  };
});

jest.mock('@/button-example', () => ({
  __esModule: true,
  default: (): JSX.Element => <div>button example page</div>,
}));

jest.mock('@/modules/User/features/Auth', () => ({
  __esModule: true,
  default: (): JSX.Element => <div>authentication page</div>,
}));

const App = jest.requireActual<typeof import('@/app')>('@/app').default;

describe('App', () => {
  beforeEach(() => {
    languageChangedHandler = undefined;
    document.documentElement.dir = '';
  });

  it('renders the authentication route and falls back to ltr when i18n.dir is unavailable', async () => {
    mockI18n = {
      language: 'en',
    };

    render(<App />);

    expect(await screen.findByText('authentication page')).toBeInTheDocument();
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('subscribes to language changes and updates document direction', async () => {
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

    expect(await screen.findByText('authentication page')).toBeInTheDocument();
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
