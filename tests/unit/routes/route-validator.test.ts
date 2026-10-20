import type { ComponentType } from 'react';

import ROUTE_PATHS from '@/routes/route-paths';
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

    expect(() => routeValidator.validate({ items: modules })).not.toThrow();
  });

  it('rejects duplicate module ids (negative)', () => {
    const modules: RouteModule[] = [
      { id: 'dupe', routes: [{ path: '/x', load: page }] },
      { id: 'dupe', routes: [{ path: '/y', load: page }] },
    ];

    expect(() => routeValidator.validate({ items: modules })).toThrow(
      'Duplicate route module id: dupe'
    );
  });

  it('rejects a route with neither path nor index (negative)', () => {
    // The discriminated union forbids this at compile time; cast to exercise the
    // runtime guard that still protects dynamically-built contracts.
    const modules: RouteModule[] = [
      { id: 'a', routes: [{ load: page } as unknown as AppRouteObject] },
    ];

    expect(() => routeValidator.validate({ items: modules })).toThrow(
      'Route must declare a path or be an index route'
    );
  });

  it('accepts a flagged route when a not-found route is registered', () => {
    const modules: RouteModule[] = [
      {
        id: 'flagged',
        routes: [
          { path: '/flagged', flag: 'userSettings', load: page },
          { path: ROUTE_PATHS.notFound, guard: 'public', load: page },
        ],
      },
    ];

    expect(() => routeValidator.validate({ items: modules })).not.toThrow();
  });

  it('finds the not-found route in another module than the flagged one', () => {
    const modules: RouteModule[] = [
      { id: 'flagged', routes: [{ path: '/flagged', flag: 'userSettings', load: page }] },
      { id: 'shell', routes: [{ path: ROUTE_PATHS.notFound, guard: 'public', load: page }] },
    ];

    expect(() => routeValidator.validate({ items: modules })).not.toThrow();
  });

  it('rejects a flagged route when no not-found route is registered (negative)', () => {
    const modules: RouteModule[] = [
      { id: 'flagged', routes: [{ path: '/flagged', flag: 'userSettings', load: page }] },
      { id: 'other', routes: [{ path: '/other', guard: 'public', load: page }] },
    ];

    expect(() => routeValidator.validate({ items: modules })).toThrow(
      'A flagged route needs a registered public not-found route'
    );
  });

  it('rejects a flagged route whose only not-found route is protected (negative)', () => {
    const modules: RouteModule[] = [
      {
        id: 'flagged',
        routes: [
          { path: '/flagged', flag: 'userSettings', load: page },
          { path: ROUTE_PATHS.notFound, guard: 'protected', load: page },
        ],
      },
    ];

    expect(() => routeValidator.validate({ items: modules })).toThrow(
      'A flagged route needs a registered public not-found route'
    );
  });

  it('accepts a flagged route beside a not-found route that declares no guard', () => {
    const modules: RouteModule[] = [
      {
        id: 'flagged',
        routes: [
          { path: '/flagged', flag: 'userSettings', load: page },
          { path: ROUTE_PATHS.notFound, load: page },
        ],
      },
    ];

    expect(() => routeValidator.validate({ items: modules })).not.toThrow();
  });

  it('accepts a registry without a not-found route while no route is flagged', () => {
    const modules: RouteModule[] = [{ id: 'plain', routes: [{ path: '/plain', load: page }] }];

    expect(() => routeValidator.validate({ items: modules })).not.toThrow();
  });

  it('rejects a nested child that declares a flag (negative)', () => {
    const modules: RouteModule[] = [
      {
        id: 'a',
        routes: [
          {
            path: '/parent',
            load: page,
            children: [{ path: 'child', flag: 'userSettings', load: page }],
          },
          { path: ROUTE_PATHS.notFound, guard: 'public', load: page },
        ],
      },
    ];

    expect(() => routeValidator.validate({ items: modules })).toThrow(
      'Nested routes must not declare a flag (flags are top-level only)'
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

    expect(() => routeValidator.validate({ items: modules })).toThrow(
      'Nested routes must not declare a guard'
    );
  });
});
