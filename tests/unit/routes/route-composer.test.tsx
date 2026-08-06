import type { ComponentType, ReactElement } from 'react';
import type { RouteObject } from 'react-router-dom';

import RouteError from '@/components/error-boundary/route-error';
import AppLayout from '@/components/layouts/app-layout';
import RootLayout from '@/components/layouts/root-layout';
import { PERMISSIONS } from '@/lib/access/permission-catalog';
import PermissionRoute from '@/routes/permission-route';
import registry from '@/routes/registry';
import routeComposer from '@/routes/route-composer';
import ROUTE_PATHS from '@/routes/route-paths';
import type { PermissionRouteProps } from '@/routes/types/permission-route';
import type { RouteModule } from '@/routes/types/route-module';
import ProtectedRoute from '@auth/components/protected-route';

const page = (): Promise<{ default: ComponentType }> =>
  Promise.resolve({ default: (): null => null });

const typeOf = (route: RouteObject): unknown => (route.element as ReactElement).type;
const isLayout = (route: RouteObject): boolean =>
  route.path === undefined && Boolean(route.children);

describe('route composer', () => {
  it('wraps every route in a single RootLayout with a route error boundary (invariant A)', () => {
    const tree = routeComposer.compose(registry);

    expect(tree).toHaveLength(1);
    expect(tree[0].path).toBe(ROUTE_PATHS.home);
    expect(typeOf(tree[0])).toBe(RootLayout);
    expect((tree[0].errorElement as ReactElement).type).toBe(RouteError);
  });

  it('nests protected routes under ProtectedRoute then AppLayout (invariants B, D)', () => {
    const tree = routeComposer.compose(registry);
    const branch = tree[0].children?.find(isLayout) as RouteObject;
    const layout = branch.children?.[0] as RouteObject;

    expect(typeOf(branch)).toBe(ProtectedRoute);
    expect(typeOf(layout)).toBe(AppLayout);
  });

  it('gates a permission-carrying route behind PermissionRoute inside AppLayout (#114)', () => {
    const tree = routeComposer.compose(registry);
    const branch = tree[0].children?.find(isLayout) as RouteObject;
    const layout = branch.children?.[0] as RouteObject;
    const gate = layout.children?.find((route) => typeOf(route) === PermissionRoute);

    expect(gate).toBeDefined();
    expect((gate?.element as ReactElement<PermissionRouteProps>).props.permission).toBe(
      PERMISSIONS.appHome
    );
    expect(gate?.children?.some((route) => route.index)).toBe(true);
  });

  it('keeps an un-gated protected route directly under AppLayout (#114)', () => {
    const modules: RouteModule[] = [
      { id: 'plain', routes: [{ path: '/plain', guard: 'protected', load: page }] },
    ];
    const tree = routeComposer.compose(modules);
    const branch = tree[0].children?.find(isLayout) as RouteObject;
    const layout = branch.children?.[0] as RouteObject;

    expect(layout.children?.map((route) => route.path)).toEqual(['/plain']);
  });

  it('keeps public routes directly under RootLayout, never under AppLayout (invariant B)', () => {
    const tree = routeComposer.compose(registry);
    // Everything that is not the protected layout branch is a flat public route.
    const flat = (tree[0].children ?? []).filter((child) => !isLayout(child));

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

    expect(tree[0].children?.some(isLayout)).toBe(false);
  });

  it('composes a module that declares no routes into a childless root (edge: empty module)', () => {
    const tree = routeComposer.compose([{ id: 'empty', routes: [] }]);

    expect(tree).toHaveLength(1);
    expect(typeOf(tree[0])).toBe(RootLayout);
    expect(tree[0].children).toEqual([]);
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
    const parent = tree[0].children?.find((child) => child.path === '/parent') as RouteObject;

    expect(parent.children).toHaveLength(1);
    expect(parent.children?.[0].path).toBe('child');
  });
});
