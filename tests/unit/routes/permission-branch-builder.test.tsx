import type { ComponentType, ReactElement } from 'react';
import type { RouteObject } from 'react-router-dom';

import { PERMISSIONS } from '@/lib/access/permission-catalog';
import permissionBranchBuilder from '@/routes/permission-branch-builder';
import PermissionRoute from '@/routes/permission-route';
import type { AppRouteObject } from '@/routes/types/app-route';
import type { PermissionRouteProps } from '@/routes/types/permission-route';

const page = (): Promise<{ default: ComponentType }> =>
  Promise.resolve({ default: (): null => null });

const at = <T,>(list: readonly T[], index: number): T => {
  const item = list[index];
  if (item === undefined) {
    throw new Error(`missing index ${index}`);
  }
  return item;
};

const childrenOf = (route: RouteObject): RouteObject[] => {
  const { children } = route;
  if (children === undefined) {
    throw new Error('route has no children');
  }
  return children;
};

const elementTypeOf = (route: RouteObject): unknown => (route.element as ReactElement).type;

const permissionOf = (route: RouteObject): unknown =>
  (route.element as ReactElement<PermissionRouteProps>).props.permission;

const isBranch = (route: RouteObject): boolean => elementTypeOf(route) === PermissionRoute;

const pathsOf = (routes: RouteObject[] | undefined): (string | undefined)[] =>
  (routes ?? []).map((route) => route.path);

describe('permission branch builder (#114)', () => {
  it('maps a route with no meta straight through, without a PermissionRoute wrapper', () => {
    const routes: AppRouteObject[] = [{ path: '/plain', load: page }];

    const built = permissionBranchBuilder.build(routes);

    expect(built).toHaveLength(1);
    expect(at(built, 0).path).toBe('/plain');
    expect(at(built, 0).children).toBeUndefined();
    expect(isBranch(at(built, 0))).toBe(false);
  });

  it('maps a route whose meta carries no permission straight through', () => {
    const routes: AppRouteObject[] = [
      { path: '/titled', load: page, meta: { titleKey: 'sign_in.title' } },
    ];

    const built = permissionBranchBuilder.build(routes);

    expect(built).toHaveLength(1);
    expect(at(built, 0).path).toBe('/titled');
    expect(isBranch(at(built, 0))).toBe(false);
  });

  it('groups routes sharing one permission under a single PermissionRoute element', () => {
    const routes: AppRouteObject[] = [
      { path: '/contacts', load: page, meta: { permission: PERMISSIONS.contactRead } },
      { path: '/contacts/:id', load: page, meta: { permission: PERMISSIONS.contactRead } },
    ];

    const built = permissionBranchBuilder.build(routes);

    expect(built).toHaveLength(1);
    expect(isBranch(at(built, 0))).toBe(true);
    expect(permissionOf(at(built, 0))).toBe(PERMISSIONS.contactRead);
    expect(at(built, 0).path).toBeUndefined();
    expect(pathsOf(at(built, 0).children)).toEqual(['/contacts', '/contacts/:id']);
  });

  it('creates one branch per distinct permission, in first-seen order', () => {
    const routes: AppRouteObject[] = [
      { path: '/deals', load: page, meta: { permission: PERMISSIONS.dealRead } },
      { path: '/contacts', load: page, meta: { permission: PERMISSIONS.contactRead } },
      { path: '/deals/new', load: page, meta: { permission: PERMISSIONS.dealRead } },
    ];

    const built = permissionBranchBuilder.build(routes);

    expect(built).toHaveLength(2);
    expect(built.every(isBranch)).toBe(true);
    expect(permissionOf(at(built, 0))).toBe(PERMISSIONS.dealRead);
    expect(pathsOf(at(built, 0).children)).toEqual(['/deals', '/deals/new']);
    expect(permissionOf(at(built, 1))).toBe(PERMISSIONS.contactRead);
    expect(pathsOf(at(built, 1).children)).toEqual(['/contacts']);
  });

  it('keeps an index route as index:true inside its permission branch', () => {
    const routes: AppRouteObject[] = [
      { index: true, load: page, meta: { permission: PERMISSIONS.appHome } },
    ];

    const built = permissionBranchBuilder.build(routes);

    expect(built).toHaveLength(1);
    expect(permissionOf(at(built, 0))).toBe(PERMISSIONS.appHome);
    expect(childrenOf(at(built, 0))).toHaveLength(1);
    expect(at(childrenOf(at(built, 0)), 0).index).toBe(true);
    expect(at(childrenOf(at(built, 0)), 0).path).toBeUndefined();
  });

  it('emits ungated routes before the gated branches (ordering invariant)', () => {
    const routes: AppRouteObject[] = [
      { path: '/gated', load: page, meta: { permission: PERMISSIONS.adminManageUsers } },
      { path: '/open', load: page },
    ];

    const built = permissionBranchBuilder.build(routes);

    expect(built).toHaveLength(2);
    expect(at(built, 0).path).toBe('/open');
    expect(isBranch(at(built, 0))).toBe(false);
    expect(isBranch(at(built, 1))).toBe(true);
    expect(permissionOf(at(built, 1))).toBe(PERMISSIONS.adminManageUsers);
    expect(pathsOf(at(built, 1).children)).toEqual(['/gated']);
  });

  it('builds an empty tree from an empty route list (edge case)', () => {
    expect(permissionBranchBuilder.build([])).toEqual([]);
  });
});
