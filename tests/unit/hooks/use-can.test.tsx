// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';

import useCan from '@/hooks/use-can';
import accessState from '@/lib/access/access-state';
import { PERMISSIONS, ROLES } from '@/lib/access/permission-catalog';
import type { Permission } from '@/lib/types/access/permission';
import { buildPrincipal } from '@tests/builders';

function renderCan(permission: Permission): boolean {
  return renderHook(() => useCan(permission)).result.current;
}

describe('useCan', () => {
  beforeEach(() => {
    accessState.clear();
  });

  afterEach(() => {
    act(() => {
      accessState.clear();
    });
  });

  it('returns true when the principal holds the permission', () => {
    const principal = buildPrincipal({ roles: [ROLES.member] });
    accessState.setSession(principal, {});

    expect(principal.permissions).toContain(PERMISSIONS.contactWrite);
    expect(renderCan(PERMISSIONS.contactWrite)).toBe(true);
  });

  it('returns false when the principal does not hold the permission', () => {
    const principal = buildPrincipal({ roles: [ROLES.member] });
    accessState.setSession(principal, {});

    expect(principal.permissions).not.toContain(PERMISSIONS.adminManageUsers);
    expect(renderCan(PERMISSIONS.adminManageUsers)).toBe(false);
  });

  it('grants an admin every permission the catalog defines', () => {
    accessState.setSession(buildPrincipal({ roles: [ROLES.admin] }), {});

    expect(renderCan(PERMISSIONS.adminManageUsers)).toBe(true);
    expect(renderCan(PERMISSIONS.tenantSwitch)).toBe(true);
    expect(renderCan(PERMISSIONS.appHome)).toBe(true);
  });

  it('returns false for every permission while anonymous', () => {
    expect(renderCan(PERMISSIONS.appHome)).toBe(false);
    expect(renderCan(PERMISSIONS.contactRead)).toBe(false);
    expect(renderCan(PERMISSIONS.adminManageUsers)).toBe(false);
  });

  it('answers per permission for the same principal', () => {
    accessState.setSession(buildPrincipal({ roles: [ROLES.viewer] }), {});

    expect(renderCan(PERMISSIONS.contactRead)).toBe(true);
    expect(renderCan(PERMISSIONS.contactWrite)).toBe(false);
  });

  it('re-evaluates the permission for a new session on the next render', () => {
    accessState.setSession(buildPrincipal({ roles: [ROLES.viewer] }), {});
    const { result, rerender } = renderHook(() => useCan(PERMISSIONS.contactWrite));
    expect(result.current).toBe(false);

    accessState.setSession(buildPrincipal({ roles: [ROLES.manager] }), {});
    rerender();

    expect(result.current).toBe(true);
  });
});
