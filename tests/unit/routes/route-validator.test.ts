import type { ComponentType } from 'react';

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
});
