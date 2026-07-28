import type { ComponentType, ReactElement } from 'react';
import type { RouteObject } from 'react-router-dom';

import RouteError from '@/components/error-boundary/route-error';
import AppLayout from '@/components/layouts/app-layout';
import RootLayout from '@/components/layouts/root-layout';
import registry from '@/routes/registry';
import routeComposer from '@/routes/route-composer';
import ROUTE_PATHS from '@/routes/route-paths';
import type { RouteModule } from '@/routes/types/route-module';
import ProtectedRoute from '@auth/components/protected-route';

const page = (): Promise<{ default: ComponentType }> =>
  Promise.resolve({ default: (): null => null });

const typeOf = (route: RouteObject): unknown => (route.element as ReactElement).type;
const isLayout = (route: RouteObject): boolean =>
  route.path === undefined && Boolean(route.children);
const rootOf = (tree: RouteObject[]): RouteObject => {
  const [root] = tree;
  if (!root) throw new Error('route composer produced an empty tree');
  return root;
};

describe('route composer', () => {
  it('wraps every route in a single RootLayout with a route error boundary (invariant A)', () => {
    const tree = routeComposer.compose(registry);
    const root = rootOf(tree);

    expect(tree).toHaveLength(1);
    expect(root.path).toBe(ROUTE_PATHS.home);
    expect(typeOf(root)).toBe(RootLayout);
    expect((root.errorElement as ReactElement).type).toBe(RouteError);
  });

  it('nests protected routes under ProtectedRoute then AppLayout (invariants B, D)', () => {
    const tree = routeComposer.compose(registry);
    const branch = rootOf(tree).children?.find(isLayout) as RouteObject;
    const layout = branch.children?.[0] as RouteObject;

    expect(typeOf(branch)).toBe(ProtectedRoute);
    expect(typeOf(layout)).toBe(AppLayout);
    expect(layout.children?.some((route) => route.index)).toBe(true);
  });

  it('keeps public routes directly under RootLayout, never under AppLayout (invariant B)', () => {
    const tree = routeComposer.compose(registry);
    // Everything that is not the protected layout branch is a flat public route.
    const flat = (rootOf(tree).children ?? []).filter((child) => !isLayout(child));

    // A protected route (the home index route) must never leak into the flat list.
    expect(flat.every((child) => child.index !== true)).toBe(true);
    expect(flat.map((child) => child.path)).toEqual([
      ROUTE_PATHS.notFound,
      ROUTE_PATHS.signUp,
      ROUTE_PATHS.signIn,
    ]);
  });

  it('omits the protected branch when no route is protected (edge: empty branch)', () => {
    const modules: RouteModule[] = [
      { id: 'only-public', routes: [{ path: '/p', guard: 'public', load: page }] },
    ];
    const tree = routeComposer.compose(modules);

    expect(rootOf(tree).children?.some(isLayout)).toBe(false);
  });

  it('composes a module that declares no routes into a childless root (edge: empty module)', () => {
    const tree = routeComposer.compose([{ id: 'empty', routes: [] }]);
    const root = rootOf(tree);

    expect(tree).toHaveLength(1);
    expect(typeOf(root)).toBe(RootLayout);
    expect(root.children).toEqual([]);
  });

  it('maps nested child routes recursively (edge: nested children)', () => {
    const modules: RouteModule[] = [
      {
        id: 'nested',
        routes: [
          {
            path: '/parent',
            guard: 'public',
            load: page,
            children: [{ path: 'child', load: page }],
          },
        ],
      },
    ];
    const tree = routeComposer.compose(modules);
    const parent = rootOf(tree).children?.find((child) => child.path === '/parent') as RouteObject;

    expect(parent.children).toHaveLength(1);
    expect(parent.children?.[0]?.path).toBe('child');
  });
});
