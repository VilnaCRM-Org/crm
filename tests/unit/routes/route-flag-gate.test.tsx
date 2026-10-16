import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';

import featureFlagService from '@/config/runtime/feature-flag-service';
import RouteFlagGate from '@/routes/route-flag-gate';
import ProtectedRoute from '@auth/components/protected-route';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const NOT_FOUND = 'not found page';

const gateRoutes = (children: RouteObject[]): RouteObject[] => [
  { element: <RouteFlagGate notFound={<p>{NOT_FOUND}</p>} />, children },
];

const settings: RouteObject = {
  path: '/settings',
  handle: { flag: 'userSettings' },
  element: <p>settings page</p>,
};
const open: RouteObject = { path: '/open', element: <p>open page</p> };

const renderAt = (path: string, routes: RouteObject[]): void => {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />);
};

const enable = (value: boolean): void => {
  writeConfigBlock(JSON.stringify({ flags: { userSettings: value } }));
};

describe('RouteFlagGate', () => {
  beforeEach(() => resetClientStores());

  afterEach(() => {
    clearConfigBlock();
    jest.restoreAllMocks();
  });

  it('renders the not-found element and never the flagged page while its flag is off', () => {
    enable(false);

    renderAt('/settings', gateRoutes([settings, open]));

    expect(screen.getByText(NOT_FOUND)).toBeInTheDocument();
    expect(screen.queryByText('settings page')).not.toBeInTheDocument();
  });

  it('renders the not-found element on the shipped default when no block exists', () => {
    renderAt('/settings', gateRoutes([settings]));

    expect(screen.getByText(NOT_FOUND)).toBeInTheDocument();
  });

  it('renders the outlet when the flag is on', () => {
    enable(true);

    renderAt('/settings', gateRoutes([settings]));

    expect(screen.getByText('settings page')).toBeInTheDocument();
    expect(screen.queryByText(NOT_FOUND)).not.toBeInTheDocument();
  });

  it('renders the outlet for a matched route without a flag, whatever the flag value', () => {
    enable(false);

    renderAt('/open', gateRoutes([settings, open]));

    expect(screen.getByText('open page')).toBeInTheDocument();
    expect(screen.queryByText(NOT_FOUND)).not.toBeInTheDocument();
  });

  it('finds the flag on any matched route, not only the leaf', () => {
    enable(false);
    const parent: RouteObject = {
      path: '/parent',
      handle: { flag: 'userSettings' },
      children: [{ path: 'child', element: <p>child page</p> }],
    };

    renderAt('/parent/child', gateRoutes([parent]));

    expect(screen.getByText(NOT_FOUND)).toBeInTheDocument();
    expect(screen.queryByText('child page')).not.toBeInTheDocument();
  });

  it('reads the flag service during render for a matched flagged route', () => {
    enable(true);
    const isEnabled = jest.spyOn(featureFlagService, 'isEnabled');

    renderAt('/settings', gateRoutes([settings]));

    expect(isEnabled).toHaveBeenCalledWith('userSettings');
  });

  it('reads no flag for a route without one', () => {
    const isEnabled = jest.spyOn(featureFlagService, 'isEnabled');

    renderAt('/open', gateRoutes([open]));

    expect(isEnabled).not.toHaveBeenCalled();
  });

  describe('above ProtectedRoute', () => {
    const protectedRoutes = (): RouteObject[] => [
      { path: '/sign-in', element: <p>sign in page</p> },
      ...gateRoutes([{ element: <ProtectedRoute />, children: [settings] }]),
    ];

    it('shows the not-found page to a visitor without a token, with no sign-in redirect', () => {
      enable(false);

      renderAt('/settings', protectedRoutes());

      expect(screen.getByText(NOT_FOUND)).toBeInTheDocument();
      expect(screen.queryByText('sign in page')).not.toBeInTheDocument();
    });

    it('redirects a visitor without a token to sign-in once the flag is on', () => {
      enable(true);

      renderAt('/settings', protectedRoutes());

      expect(screen.getByText('sign in page')).toBeInTheDocument();
      expect(screen.queryByText(NOT_FOUND)).not.toBeInTheDocument();
    });
  });

  it('accepts any ReactElement as the not-found element', () => {
    enable(false);
    const element: ReactElement = <h1>custom not found</h1>;

    renderAt('/settings', [
      { element: <RouteFlagGate notFound={element} />, children: [settings] },
    ]);

    expect(screen.getByRole('heading', { name: 'custom not found' })).toBeInTheDocument();
  });
});
