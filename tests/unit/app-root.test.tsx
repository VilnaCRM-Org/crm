// @jest-environment jsdom

import './utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Request as NodeFetchRequest } from 'node-fetch';

type MockI18n = {
  language: string;
  dir?: (language: string) => 'ltr' | 'rtl';
  on?: (event: string, callback: () => void) => void;
  off?: (event: string, callback: () => void) => void;
};

const mockI18n: MockI18n = {
  language: 'en',
};

const mockStore = {
  getState: (): { auth: { token: string | null } } => ({
    auth: { token: 'token' },
  }),
  subscribe: (): (() => void) => () => undefined,
  dispatch: (): void => undefined,
};

window.history.pushState({}, '', '/');

if (typeof Request === 'undefined') {
  globalThis.Request = NodeFetchRequest;
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

const App = require('@/app').default as typeof import('@/app').default;

describe('App root route', () => {
  it('renders the button example page through the protected outlet', async () => {
    render(<App />);

    expect(await screen.findByText('button example page')).toBeInTheDocument();
  });
});
