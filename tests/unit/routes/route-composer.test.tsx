import { type ComponentType, isValidElement, type ReactElement } from 'react';
import type { ClientOnErrorFunction, RouteObject } from 'react-router';

import RouteError from '@/components/error-boundary/route-error';
import AppLayout from '@/components/layouts/app-layout';
import RootLayout from '@/components/layouts/root-layout';
import featureFlagService from '@/config/runtime/feature-flag-service';
import registry from '@/routes/registry';
import routeComposer from '@/routes/route-composer';
import RouteFlagGate from '@/routes/route-flag-gate';
import routeMapper from '@/routes/route-mapper';
import ROUTE_PATHS from '@/routes/route-paths';
import type { RouteModule } from '@/routes/types/route-module';
import boundaryErrorReporter from '@/services/error-reporting/boundary-error-reporter';
import ProtectedRoute from '@auth/components/protected-route';
import { buildToken } from '@tests/builders';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';

type ErrorInfoArg = Parameters<ClientOnErrorFunction>[1];

const page = (): Promise<{ default: ComponentType }> =>
  Promise.resolve({ default: (): null => null });

const typeOf = (route: RouteObject): unknown => (route.element as ReactElement).type;
const rootOf = (tree: RouteObject[]): RouteObject => {
  const [root] = tree;
  if (tree.length !== 1 || !root) {
    throw new Error('route composer must produce exactly one root');
  }
  return root;
};
const walk = (routes: readonly RouteObject[]): RouteObject[] =>
  routes.flatMap((route) => [route, ...walk(route.children ?? [])]);
const errorBoundaryOf = (route: RouteObject): ReactElement<{ landmark: unknown }> =>
  route.errorElement as ReactElement<{ landmark: unknown }>;
const landmarkOf = (route: RouteObject): unknown => errorBoundaryOf(route).props.landmark;
const isGate = (route: RouteObject | undefined): boolean =>
  route !== undefined && typeOf(route) === RouteFlagGate;
const isGuard = (route: RouteObject): boolean => typeOf(route) === ProtectedRoute;
// The level the protected branch and the public pages share: directly under RootLayout, or under
// the flag gate when it is the root's only child (a registry in which some route declares a flag).
const levelOf = (tree: RouteObject[]): RouteObject[] => {
  const children = rootOf(tree).children ?? [];
  const [only] = children;
  return children.length === 1 && isGate(only) ? (only?.children ?? []) : children;
};
const publicLevelOf = (tree: RouteObject[]): RouteObject[] =>
  levelOf(tree).filter((route) => !isGuard(route));
const protectedBranchOf = (tree: RouteObject[]): { guard: RouteObject; layout: RouteObject } => {
  const guard = levelOf(tree).find(isGuard);
  const layout = guard?.children?.[0];
  if (!guard || !layout) {
    throw new Error('route composer must nest a protected layout branch');
  }
  return { guard, layout };
};
const routeErrorInfo = (overrides: Partial<ErrorInfoArg> = {}): ErrorInfoArg => ({
  location: { pathname: '/', search: '', hash: '', state: null, key: buildToken() },
  params: {},
  pattern: '/',
  ...overrides,
});

describe('route composer', () => {
  it('wraps every route in a single RootLayout under one flag gate (invariant A)', () => {
    const tree = routeComposer.compose(registry).items;
    const root = rootOf(tree);

    expect(tree).toHaveLength(1);
    expect(root.path).toBe(ROUTE_PATHS.home);
    expect(typeOf(root)).toBe(RootLayout);
    expect(errorBoundaryOf(root).type).toBe(RouteError);
    expect(landmarkOf(root)).toBe('main');
    expect(root.children).toHaveLength(1);
    expect(isGate(root.children?.[0])).toBe(true);
  });

  it('nests protected routes under ProtectedRoute then AppLayout (invariants B, D)', () => {
    const tree = routeComposer.compose(registry).items;
    const { guard, layout } = protectedBranchOf(tree);

    expect(typeOf(guard)).toBe(ProtectedRoute);
    expect(typeOf(layout)).toBe(AppLayout);
    expect(layout.children?.some((route) => route.index)).toBe(true);
  });

  it('hands AppLayout the mapper slot and the app-shell:load reporter (OQ-17)', () => {
    const slot = (): null => null;
    const reporter = jest.fn();
    const shellSlot = jest.spyOn(routeMapper, 'shellSlot').mockReturnValue(slot);
    const reporterFor = jest.spyOn(routeMapper, 'chunkFailureReporter').mockReturnValue(reporter);

    const tree = routeComposer.compose(registry).items;
    const { layout } = protectedBranchOf(tree);
    const { props } = layout.element as ReactElement<{
      userMenu: unknown;
      onShellFailure: unknown;
    }>;

    expect(shellSlot).toHaveBeenCalledTimes(1);
    expect(shellSlot).toHaveBeenCalledWith(
      registry.items.find((module) => module.id === 'user.settings')?.shell?.userMenu
    );
    expect(reporterFor).toHaveBeenCalledWith('app-shell:load');
    expect(props.userMenu).toBe(slot);
    expect(props.onShellFailure).toBe(reporter);
    jest.restoreAllMocks();
  });

  it('passes AppLayout no badge counts, so no page renders a badge (FR-19)', () => {
    const tree = routeComposer.compose(registry).items;
    const { layout } = protectedBranchOf(tree);
    const { props } = layout.element as ReactElement<Record<string, unknown>>;

    expect(Object.keys(props).sort()).toEqual(['onShellFailure', 'userMenu']);
  });

  it('gives AppLayout no slot when no module declares shell.userMenu', () => {
    const modules: RouteModule[] = [
      ...registry.items.filter((module) => module.id !== 'user.settings'),
    ];
    const shellSlot = jest.spyOn(routeMapper, 'shellSlot');

    const tree = routeComposer.compose({ items: modules }).items;
    const { layout } = protectedBranchOf(tree);
    const { props } = layout.element as ReactElement<{ userMenu: unknown }>;

    expect(shellSlot).not.toHaveBeenCalled();
    expect(props.userMenu).toBeUndefined();
    jest.restoreAllMocks();
  });

  it('renders no AppLayout anywhere on the public branch', () => {
    const tree = routeComposer.compose(registry).items;

    expect(walk(publicLevelOf(tree)).some((route) => typeOf(route) === AppLayout)).toBe(false);
  });

  it('keeps public routes directly under the gate route, itself directly under RootLayout', () => {
    const tree = routeComposer.compose(registry).items;
    // Everything that is not the protected branch is a flat public route.
    const flat = publicLevelOf(tree);

    // A protected route (the home index route) must never leak into the flat list.
    expect(flat.every((child) => child.index !== true)).toBe(true);
    expect(flat.map((child) => child.path)).toEqual([
      ROUTE_PATHS.forbidden,
      ROUTE_PATHS.serverError,
      ROUTE_PATHS.notFound,
      ROUTE_PATHS.signUp,
      ROUTE_PATHS.signIn,
      ROUTE_PATHS.passwordRecovery,
      ROUTE_PATHS.passwordReset,
    ]);
  });

  it('attaches a RouteError errorElement to every route object in the tree (issue #116)', () => {
    const tree = routeComposer.compose(registry).items;
    const routes = walk(tree);

    expect(routes.length).toBeGreaterThan(1);
    expect(routes.map((route) => errorBoundaryOf(route).type)).toEqual(
      routes.map(() => RouteError)
    );
  });

  it('renders the protected guard and AppLayout boundaries as a main landmark', () => {
    const tree = routeComposer.compose(registry).items;
    const { guard, layout } = protectedBranchOf(tree);

    expect(landmarkOf(guard)).toBe('main');
    expect(landmarkOf(layout)).toBe('main');
  });

  it('renders page boundaries under AppLayout as a region, never a nested main', () => {
    const tree = routeComposer.compose(registry).items;
    const { layout } = protectedBranchOf(tree);
    const pages = layout.children ?? [];

    expect(pages.length).toBeGreaterThan(0);
    expect(pages.map(landmarkOf)).toEqual(pages.map(() => 'region'));
  });

  it('renders open route boundaries as a main landmark', () => {
    const tree = routeComposer.compose(registry).items;
    const flat = publicLevelOf(tree);

    expect(flat.length).toBeGreaterThan(0);
    expect(flat.map(landmarkOf)).toEqual(flat.map(() => 'main'));
  });

  it('maps the 403 and 5xx pages as open main-landmark routes outside the guard (#309)', () => {
    const tree = routeComposer.compose(registry).items;
    const errorPaths: string[] = [ROUTE_PATHS.forbidden, ROUTE_PATHS.serverError];
    const open = publicLevelOf(tree).filter((child) => errorPaths.includes(child.path ?? ''));
    const { guard } = protectedBranchOf(tree);
    const guardedPaths = walk(guard.children ?? []).map((route) => route.path);

    expect(open.map((route) => route.path)).toEqual(errorPaths);
    expect(open.map(landmarkOf)).toEqual(['main', 'main']);
    expect(guardedPaths.filter((path) => errorPaths.includes(path ?? ''))).toEqual([]);
  });

  it('omits the protected branch when no route is protected (edge: empty branch)', () => {
    const modules: RouteModule[] = [
      { id: 'only-public', routes: [{ path: '/p', guard: 'public', load: page }] },
    ];
    const tree = routeComposer.compose({ items: modules }).items;

    expect(levelOf(tree).some(isGuard)).toBe(false);
  });

  it('composes a module that declares no routes into a childless root (edge: empty module)', () => {
    const tree = routeComposer.compose({ items: [{ id: 'empty', routes: [] }] }).items;
    const root = rootOf(tree);

    expect(tree).toHaveLength(1);
    expect(typeOf(root)).toBe(RootLayout);
    expect(root.children).toEqual([]);
  });

  it('maps nested child routes recursively with their parent landmark (edge: nested)', () => {
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
    const tree = routeComposer.compose({ items: modules }).items;
    const parent = levelOf(tree).find((child) => child.path === '/parent') as RouteObject;
    const child = parent.children?.[0] as RouteObject;

    expect(parent.children).toHaveLength(1);
    expect(child.path).toBe('child');
    expect(errorBoundaryOf(child).type).toBe(RouteError);
    expect(landmarkOf(child)).toBe('main');
  });

  it('refuses to compose modules that share an id (validation runs before composing)', () => {
    const id = buildToken();
    const modules: RouteModule[] = [
      { id, routes: [{ path: '/first', guard: 'public', load: page }] },
      { id, routes: [{ path: '/second', guard: 'public', load: page }] },
    ];

    expect(() => routeComposer.compose({ items: modules })).toThrow(
      `Duplicate route module id: ${id}`
    );
  });

  it('refuses to compose a nested route that declares its own guard', () => {
    const modules: RouteModule[] = [
      {
        id: 'nested-guard',
        routes: [
          {
            path: '/parent',
            guard: 'public',
            load: page,
            children: [{ path: 'child', guard: 'protected', load: page }],
          },
        ],
      },
    ];

    expect(() => routeComposer.compose({ items: modules })).toThrow(
      'Nested routes must not declare a guard (guards are top-level only)'
    );
  });

  it('propagates the region landmark to nested children of a protected route', () => {
    const modules: RouteModule[] = [
      {
        id: 'nested-protected',
        routes: [
          {
            path: '/parent',
            guard: 'protected',
            load: page,
            children: [{ index: true, load: page }],
          },
        ],
      },
    ];
    const tree = routeComposer.compose({ items: modules }).items;
    const { layout } = protectedBranchOf(tree);
    const parent = layout.children?.[0] as RouteObject;
    const child = parent.children?.[0] as RouteObject;

    expect(landmarkOf(parent)).toBe('region');
    expect(child.index).toBe(true);
    expect(landmarkOf(child)).toBe('region');
  });
});

describe('route composer flag gate (Story 1.5)', () => {
  const flaggedModules = (): RouteModule[] => [
    {
      id: 'flagged',
      routes: [
        { path: '/settings', guard: 'protected', flag: 'userSettings', load: page },
        { path: '/open', guard: 'public', load: page },
        { path: ROUTE_PATHS.notFound, guard: 'public', load: page },
      ],
    },
  ];
  const composeFlagged = (): RouteObject[] =>
    routeComposer.compose({ items: flaggedModules() }).items;

  afterEach(() => {
    clearConfigBlock();
    jest.restoreAllMocks();
  });

  it('emits exactly one gate route directly under RootLayout when a route declares a flag', () => {
    const tree = composeFlagged();
    const children = rootOf(tree).children ?? [];
    const [gate] = children;

    expect(children).toHaveLength(1);
    expect(isGate(gate)).toBe(true);
    expect(gate?.path).toBeUndefined();
    expect(gate && errorBoundaryOf(gate).type).toBe(RouteError);
    expect(gate && landmarkOf(gate)).toBe('main');
  });

  it('keeps the protected branch and the public pages under the gate, in PR #340 order', () => {
    const tree = composeFlagged();
    const { guard, layout } = protectedBranchOf(tree);

    expect(levelOf(tree).map((route) => route.path)).toEqual([undefined, '/open', '*']);
    expect(typeOf(guard)).toBe(ProtectedRoute);
    expect(typeOf(layout)).toBe(AppLayout);
    expect(publicLevelOf(tree).map((route) => route.path)).toEqual(['/open', '*']);
  });

  it('registers the flagged route whatever the flag value and marks it with handle.flag', () => {
    const tree = composeFlagged();
    const { layout } = protectedBranchOf(tree);
    const settings = layout.children?.find((route) => route.path === '/settings');

    expect(settings?.handle).toEqual({ flag: 'userSettings' });
    expect(walk(tree).filter((route) => route.handle !== undefined)).toHaveLength(1);
  });

  it('hands the gate the mapped not-found page element', () => {
    const gate = rootOf(composeFlagged()).children?.[0];
    const { notFound } = (gate?.element as ReactElement<{ notFound: unknown }>).props;

    expect(isValidElement(notFound)).toBe(true);
  });

  it('maps the not-found page once, with a main landmark, and reuses it for the gate', () => {
    const map = jest.spyOn(routeMapper, 'map');

    const tree = composeFlagged();

    const notFoundCalls = map.mock.calls.filter(([route]) => route.path === ROUTE_PATHS.notFound);
    expect(notFoundCalls).toEqual([
      [expect.objectContaining({ path: ROUTE_PATHS.notFound }), 'main'],
    ]);
    const gate = rootOf(tree).children?.[0];
    const page = publicLevelOf(tree).find((route) => route.path === ROUTE_PATHS.notFound);
    const { notFound } = (gate?.element as ReactElement<{ notFound: unknown }>).props;
    expect(notFound).toBe(page?.element);
  });

  it('emits exactly one gate for the real registry and flags only the settings routes', () => {
    const tree = routeComposer.compose(registry).items;

    expect(walk(tree).filter((route) => isGate(route))).toHaveLength(1);
    expect(walk(tree).filter((route) => route.handle !== undefined)).toEqual(
      [
        ROUTE_PATHS.settings,
        ROUTE_PATHS.settingsIntegrations,
        ROUTE_PATHS.settingsWebhooks,
        ROUTE_PATHS.settingsBilling,
      ].map((path) => expect.objectContaining({ path, handle: { flag: 'userSettings' } }))
    );
    expect(protectedBranchOf(tree).layout.children?.map((route) => route.path)).toEqual([
      undefined,
      ROUTE_PATHS.boards,
      ROUTE_PATHS.products,
      ROUTE_PATHS.orders,
      ROUTE_PATHS.contacts,
      ROUTE_PATHS.analytics,
      ROUTE_PATHS.settings,
      ROUTE_PATHS.settingsIntegrations,
      ROUTE_PATHS.settingsWebhooks,
      ROUTE_PATHS.settingsBilling,
    ]);
  });

  it('emits no gate level for the real registry without its flagged settings route', () => {
    const modules = registry.items.filter((module) => module.id !== 'user.settings');
    const tree = routeComposer.compose({ items: modules }).items;

    expect(isGate(rootOf(tree).children?.[0])).toBe(false);
    expect(walk(tree).some((route) => isGate(route))).toBe(false);
    expect(walk(tree).filter((route) => route.handle !== undefined)).toEqual([]);
    expect(levelOf(tree)).toBe(rootOf(tree).children);
  });

  it('emits no gate level for a flag-free registry without a not-found route', () => {
    const modules: RouteModule[] = [
      { id: 'only-public', routes: [{ path: '/p', guard: 'public', load: page }] },
    ];
    const tree = routeComposer.compose({ items: modules }).items;

    expect(rootOf(tree).children?.map((route) => route.path)).toEqual(['/p']);
  });

  it('never reads a flag while composing, even with a malformed runtime block', () => {
    writeConfigBlock('{ "flags": ');
    const isEnabled = jest.spyOn(featureFlagService, 'isEnabled');

    expect(() => composeFlagged()).not.toThrow();
    expect(isEnabled).not.toHaveBeenCalled();
  });

  it('refuses a flagged registry without a not-found route before mapping any route', () => {
    const map = jest.spyOn(routeMapper, 'map');
    const modules: RouteModule[] = [
      { id: 'flagged', routes: [{ path: '/settings', flag: 'userSettings', load: page }] },
    ];

    expect(() => routeComposer.compose({ items: modules })).toThrow(
      'A flagged route needs a registered public not-found route'
    );
    expect(map).not.toHaveBeenCalled();
  });

  it('refuses a nested route that declares a flag', () => {
    const modules: RouteModule[] = [
      {
        id: 'nested-flag',
        routes: [
          {
            path: '/parent',
            guard: 'public',
            load: page,
            children: [{ path: 'child', flag: 'userSettings', load: page }],
          },
          { path: ROUTE_PATHS.notFound, guard: 'public', load: page },
        ],
      },
    ];

    expect(() => routeComposer.compose({ items: modules })).toThrow(
      'Nested routes must not declare a flag (flags are top-level only)'
    );
  });
});

describe('route composer error handler (issue #116)', () => {
  let report: jest.SpyInstance;

  beforeEach(() => {
    report = jest.spyOn(boundaryErrorReporter, 'report').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reports a render error with its component stack on the route surface', () => {
    const error = new Error(buildToken());
    const componentStack = `\n    at ${buildToken()}`;
    const pattern = `/${buildToken()}/:id`;

    routeComposer.routeErrorHandler()(
      error,
      routeErrorInfo({ pattern, errorInfo: { componentStack } })
    );

    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith(error, { componentStack, surface: 'route', pattern });
    expect(report.mock.calls[0]?.[0]).toBe(error);
  });

  it('reports a loader-style error that carries no React error info', () => {
    const error = new Error(buildToken());

    routeComposer.routeErrorHandler()(error, routeErrorInfo({ pattern: '/' }));

    expect(report).toHaveBeenCalledWith(error, {
      componentStack: undefined,
      surface: 'route',
      pattern: '/',
    });
  });

  it('converts a thrown non-Error value into an Error carrying its string form', () => {
    const thrown = buildToken();

    routeComposer.routeErrorHandler()(thrown, routeErrorInfo());

    const [reported] = report.mock.calls[0] ?? [];
    expect(reported).toBeInstanceOf(Error);
    expect((reported as Error).message).toBe(thrown);
  });

  it('converts a route error response into an Error naming its status', () => {
    const statusText = buildToken();

    routeComposer.routeErrorHandler()(
      { status: 503, statusText, internal: false, data: null },
      routeErrorInfo()
    );

    const [reported] = report.mock.calls[0] ?? [];
    expect(reported).toBeInstanceOf(Error);
    expect((reported as Error).message).toBe(`503 ${statusText}`);
  });

  it('never forwards route params or the location into the capture context', () => {
    const info = routeErrorInfo({
      params: { id: buildToken() },
      location: { pathname: `/${buildToken()}`, search: '', hash: '', state: null, key: 'k' },
      errorInfo: { componentStack: buildToken() },
    });

    routeComposer.routeErrorHandler()(new Error(buildToken()), info);

    const [, context] = report.mock.calls[0] ?? [];
    expect(Object.keys(context as object).sort()).toEqual(['componentStack', 'pattern', 'surface']);
    expect(context).not.toHaveProperty('params');
    expect(context).not.toHaveProperty('location');
  });

  it('never lets a reporter failure escape into the router boundary', () => {
    report.mockImplementation(() => {
      throw new Error(buildToken());
    });

    expect(() =>
      routeComposer.routeErrorHandler()(new Error(buildToken()), routeErrorInfo())
    ).not.toThrow();
    expect(report).toHaveBeenCalledTimes(1);
  });
});
