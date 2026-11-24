import type { ComponentType } from 'react';

import routeValidator from '@/routes/route-validator';
import type { AppRouteObject } from '@/routes/types/app-route';
import type { RouteModule } from '@/routes/types/route-module';
import type { ShellSlotModule } from '@/routes/types/shell-slot';

const page = (): Promise<{ default: ComponentType }> =>
  Promise.resolve({ default: (): null => null });

const slotLoad = (): Promise<ShellSlotModule> => Promise.resolve({ default: (): null => null });

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

  it('accepts one module that declares shell.userMenu', () => {
    const modules: RouteModule[] = [
      { id: 'a', routes: [{ index: true, load: page }] },
      { id: 'b', routes: [{ path: '/b', load: page }], shell: { userMenu: slotLoad } },
      { id: 'c', routes: [{ path: '/c', load: page }], shell: {} },
    ];

    expect(() => routeValidator.validate({ items: modules })).not.toThrow();
  });

  it('rejects two modules that both declare shell.userMenu (negative)', () => {
    const modules: RouteModule[] = [
      { id: 'first', routes: [{ path: '/a', load: page }], shell: { userMenu: slotLoad } },
      { id: 'second', routes: [{ path: '/b', load: page }], shell: { userMenu: slotLoad } },
    ];

    expect(() => routeValidator.validate({ items: modules })).toThrow(
      'Only one route module may declare shell.userMenu (first, second)'
    );
  });
});
