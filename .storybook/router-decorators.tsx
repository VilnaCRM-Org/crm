import type { Decorator } from '@storybook/react-webpack5';
import { type JSX, useState } from 'react';
import {
  createMemoryRouter,
  MemoryRouter,
  Outlet,
  Route,
  RouterProvider,
  Routes,
  type RouteObject,
} from 'react-router';

import type { ProtectedOutletContext } from '../src/routes/types/protected-outlet-context';

import { noop } from './story-callbacks';

export const storySignOut: ProtectedOutletContext = { signOut: noop };

export function withMemoryRouter(initialPath = '/'): Decorator {
  return function MemoryRouterDecorator(Story): JSX.Element {
    return (
      <MemoryRouter initialEntries={[initialPath]}>
        <Story />
      </MemoryRouter>
    );
  };
}

export function withProtectedOutlet(context: ProtectedOutletContext = storySignOut): Decorator {
  return function ProtectedOutletDecorator(Story): JSX.Element {
    return (
      <MemoryRouter>
        <Routes>
          <Route element={<Outlet context={context} />}>
            <Route path="*" element={<Story />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  };
}

export function DataRouterStory({
  routes,
  initialPath = '/',
}: {
  routes: RouteObject[];
  initialPath?: string;
}): JSX.Element {
  const [router] = useState(() => createMemoryRouter(routes, { initialEntries: [initialPath] }));

  return <RouterProvider router={router} />;
}
