import type { ComponentType } from 'react';

import routeValidator from '@/routes/route-validator';
import type { RouteModule } from '@/routes/types/route-module';

const page = (): Promise<{ default: ComponentType }> =>
  Promise.resolve({ default: (): null => null });

describe('route validator', () => {
  it('accepts unique module ids and locatable routes', () => {
    const modules: RouteModule[] = [
      { id: 'a', routes: [{ index: true, load: page }] },
      { id: 'b', routes: [{ path: '/b', load: page }] },
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
    const modules: RouteModule[] = [{ id: 'a', routes: [{ load: page }] }];

    expect(() => routeValidator.validate(modules)).toThrow(
      'Route must declare a path or be an index route'
    );
  });
});
