import type { ComponentType } from 'react';

import { PERMISSIONS } from '@/lib/access/permission-catalog';
import routeValidator from '@/routes/route-validator';
import type { AppRouteObject } from '@/routes/types/app-route';
import type { RouteModule } from '@/routes/types/route-module';

const page = (): Promise<{ default: ComponentType }> =>
  Promise.resolve({ default: (): null => null });

describe('route validator', () => {
  it('accepts unique module ids and locatable routes', () => {
    const modules: RouteModule[] = [
      { id: 'a', routes: [{ index: true, load: page }] },
      { id: 'b', routes: [{ path: '/b', guard: 'protected', load: page }] },
    ];

    expect(() => routeValidator.validate(modules)).not.toThrow();
  });

  it('rejects duplicate module ids (negative)', () => {
    const modules: RouteModule[] = [
      { id: 'dupe', routes: [{ path: '/x', load: page }] },
      { id: 'dupe', routes: [{ path: '/y', load: page }] },
    ];

    expect(() => routeValidator.validate(modules)).toThrow('Duplicate route module id: dupe');
  });

  it('rejects a route with neither path nor index (negative)', () => {
    // The discriminated union forbids this at compile time; cast to exercise the
    // runtime guard that still protects dynamically-built contracts.
    const modules: RouteModule[] = [
      { id: 'a', routes: [{ load: page } as unknown as AppRouteObject] },
    ];

    expect(() => routeValidator.validate(modules)).toThrow(
      'Route must declare a path or be an index route'
    );
  });

  it('rejects a nested child that declares a guard (negative)', () => {
    const modules: RouteModule[] = [
      {
        id: 'a',
        routes: [
          {
            path: '/parent',
            load: page,
            children: [{ path: 'child', guard: 'protected', load: page }],
          },
        ],
      },
    ];

    expect(() => routeValidator.validate(modules)).toThrow(
      'Nested routes must not declare a guard'
    );
  });

  it('rejects a nested child that declares a permission (negative, #114)', () => {
    // A permission on a child is silently ignored by the composer (only top-level
    // routes are grouped into a PermissionRoute branch), so it must be a contract error.
    const modules: RouteModule[] = [
      {
        id: 'a',
        routes: [
          {
            path: '/parent',
            load: page,
            children: [
              { path: 'child', load: page, meta: { permission: PERMISSIONS.contactRead } },
            ],
          },
        ],
      },
    ];

    expect(() => routeValidator.validate(modules)).toThrow(
      'Nested routes must not declare a permission'
    );
  });

  // The composer only gates the protected branch, so a permission anywhere else would be
  // dropped in silence and ship an ungated route — the same hazard as the nested case.
  it('rejects a permission on a route with no guard (negative, #114)', () => {
    const modules: RouteModule[] = [
      {
        id: 'a',
        routes: [{ path: '/a', load: page, meta: { permission: PERMISSIONS.contactRead } }],
      },
    ];

    expect(() => routeValidator.validate(modules)).toThrow(
      'Only protected routes may declare a permission'
    );
  });

  it('rejects a permission on an explicitly public route (negative, #114)', () => {
    const modules: RouteModule[] = [
      {
        id: 'a',
        routes: [
          {
            path: '/a',
            guard: 'public',
            load: page,
            meta: { permission: PERMISSIONS.contactRead },
          },
        ],
      },
    ];

    expect(() => routeValidator.validate(modules)).toThrow(
      'Only protected routes may declare a permission'
    );
  });

  it('accepts a guardless top-level route that declares no permission (positive, #114)', () => {
    const modules: RouteModule[] = [
      { id: 'a', routes: [{ path: '/a', load: page, meta: { titleKey: 'a.title' } }] },
    ];

    expect(() => routeValidator.validate(modules)).not.toThrow();
  });

  it('accepts a permission on a top-level route (positive, #114)', () => {
    const modules: RouteModule[] = [
      {
        id: 'a',
        routes: [
          { path: '/a', guard: 'protected', load: page, meta: { permission: PERMISSIONS.appHome } },
        ],
      },
    ];

    expect(() => routeValidator.validate(modules)).not.toThrow();
  });
});
