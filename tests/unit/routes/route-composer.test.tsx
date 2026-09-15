import type { ComponentType, ReactElement } from 'react';
import type { ClientOnErrorFunction, RouteObject } from 'react-router';

import RouteError from '@/components/error-boundary/route-error';
import AppLayout from '@/components/layouts/app-layout';
import RootLayout from '@/components/layouts/root-layout';
import registry from '@/routes/registry';
import routeComposer from '@/routes/route-composer';
import ROUTE_PATHS from '@/routes/route-paths';
import type { RouteModule } from '@/routes/types/route-module';
import boundaryErrorReporter from '@/services/error-reporting/boundary-error-reporter';
import ProtectedRoute from '@auth/components/protected-route';
import { buildToken } from '@tests/builders';

type ErrorInfoArg = Parameters<ClientOnErrorFunction>[1];

const page = (): Promise<{ default: ComponentType }> =>
  Promise.resolve({ default: (): null => null });

const typeOf = (route: RouteObject): unknown => (route.element as ReactElement).type;
const isLayout = (route: RouteObject): boolean =>
  route.path === undefined && Boolean(route.children);
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
const protectedBranchOf = (tree: RouteObject[]): { guard: RouteObject; layout: RouteObject } => {
  const guard = rootOf(tree).children?.find(isLayout);
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
  it('wraps every route in a single RootLayout with a route error boundary (invariant A)', () => {
    const tree = routeComposer.compose(registry);
    const root = rootOf(tree);

    expect(tree).toHaveLength(1);
    expect(root.path).toBe(ROUTE_PATHS.home);
    expect(typeOf(root)).toBe(RootLayout);
    expect(errorBoundaryOf(root).type).toBe(RouteError);
    expect(landmarkOf(root)).toBe('main');
  });

  it('nests protected routes under ProtectedRoute then AppLayout (invariants B, D)', () => {
    const tree = routeComposer.compose(registry);
    const { guard, layout } = protectedBranchOf(tree);

    expect(typeOf(guard)).toBe(ProtectedRoute);
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

  it('attaches a RouteError errorElement to every route object in the tree (issue #116)', () => {
    const tree = routeComposer.compose(registry);
    const routes = walk(tree);

    expect(routes.length).toBeGreaterThan(1);
    expect(routes.map((route) => errorBoundaryOf(route).type)).toEqual(
      routes.map(() => RouteError)
    );
  });

  it('renders the protected guard and AppLayout boundaries as a main landmark', () => {
    const tree = routeComposer.compose(registry);
    const { guard, layout } = protectedBranchOf(tree);

    expect(landmarkOf(guard)).toBe('main');
    expect(landmarkOf(layout)).toBe('main');
  });

  it('renders page boundaries under AppLayout as a region, never a nested main', () => {
    const tree = routeComposer.compose(registry);
    const { layout } = protectedBranchOf(tree);
    const pages = layout.children ?? [];

    expect(pages.length).toBeGreaterThan(0);
    expect(pages.map(landmarkOf)).toEqual(pages.map(() => 'region'));
  });

  it('renders open route boundaries as a main landmark', () => {
    const tree = routeComposer.compose(registry);
    const flat = (rootOf(tree).children ?? []).filter((child) => !isLayout(child));

    expect(flat.length).toBeGreaterThan(0);
    expect(flat.map(landmarkOf)).toEqual(flat.map(() => 'main'));
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
    const tree = routeComposer.compose(modules);
    const parent = rootOf(tree).children?.find((child) => child.path === '/parent') as RouteObject;
    const child = parent.children?.[0] as RouteObject;

    expect(parent.children).toHaveLength(1);
    expect(child.path).toBe('child');
    expect(errorBoundaryOf(child).type).toBe(RouteError);
    expect(landmarkOf(child)).toBe('main');
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
    const tree = routeComposer.compose(modules);
    const { layout } = protectedBranchOf(tree);
    const parent = layout.children?.[0] as RouteObject;
    const child = parent.children?.[0] as RouteObject;

    expect(landmarkOf(parent)).toBe('region');
    expect(child.index).toBe(true);
    expect(landmarkOf(child)).toBe('region');
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
