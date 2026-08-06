// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';

import type { TenantContextValue } from '@/hooks/types/access';
import useTenant from '@/hooks/use-tenant';
import accessState from '@/lib/access/access-state';
import { PERMISSIONS, ROLES } from '@/lib/access/permission-catalog';
import type { Principal, TenantRef } from '@/lib/types/access/principal';
import AccessProvider from '@/providers/access-provider';
import { buildPrincipal, buildTenantRef } from '@tests/builders';

interface Membership {
  readonly principal: Principal;
  readonly current: TenantRef;
  readonly other: TenantRef;
}

function seedMembership(role: 'manager' | 'member'): Membership {
  const current = buildTenantRef();
  const other = buildTenantRef();
  const principal = buildPrincipal({ roles: [role], tenants: [current, other] });
  accessState.setSession(principal, {});
  return { principal, current, other };
}

function switchTo(context: TenantContextValue, tenantId: string): boolean {
  const outcome: boolean[] = [];
  act(() => {
    outcome.push(context.switchTenant(tenantId));
  });
  return outcome[0];
}

describe('useTenant', () => {
  beforeEach(() => {
    accessState.clear();
  });

  afterEach(() => {
    act(() => {
      accessState.clear();
    });
  });

  it('exposes the active tenant and the memberships of a hydrated principal', () => {
    const { principal, current, other } = seedMembership(ROLES.manager);

    const { result } = renderHook(() => useTenant());

    expect(result.current.activeTenantId).toBe(current.id);
    expect(result.current.tenants).toBe(principal.tenants);
    expect(result.current.tenants).toEqual([current, other]);
    expect(result.current.tenants).toHaveLength(2);
  });

  it('exposes a null active tenant and an empty membership list while anonymous', () => {
    const { result } = renderHook(() => useTenant());

    expect(result.current.activeTenantId).toBeNull();
    expect(result.current.tenants).toEqual([]);
    expect(result.current.tenants).toHaveLength(0);
  });

  it('switches the active tenant when the principal may switch and belongs to the target', () => {
    const { current, other } = seedMembership(ROLES.manager);
    const { result } = renderHook(() => useTenant(), { wrapper: AccessProvider });
    expect(result.current.activeTenantId).toBe(current.id);

    expect(switchTo(result.current, other.id)).toBe(true);

    expect(result.current.activeTenantId).toBe(other.id);
    expect(accessState.get().principal?.tenantId).toBe(other.id);
    expect(result.current.tenants).toEqual([current, other]);
  });

  it('refuses the switch when the principal lacks the tenant:switch permission', () => {
    const { principal, current, other } = seedMembership(ROLES.member);
    expect(principal.permissions).not.toContain(PERMISSIONS.tenantSwitch);
    const { result } = renderHook(() => useTenant(), { wrapper: AccessProvider });

    expect(switchTo(result.current, other.id)).toBe(false);

    expect(result.current.activeTenantId).toBe(current.id);
    expect(accessState.get().principal?.tenantId).toBe(current.id);
  });

  it('refuses the switch when the target tenant is not one of the memberships', () => {
    const { current } = seedMembership(ROLES.manager);
    const foreign = buildTenantRef();
    const { result } = renderHook(() => useTenant(), { wrapper: AccessProvider });

    expect(switchTo(result.current, foreign.id)).toBe(false);

    expect(result.current.activeTenantId).toBe(current.id);
  });

  it('refuses the switch while anonymous', () => {
    const tenant = buildTenantRef();
    const { result } = renderHook(() => useTenant(), { wrapper: AccessProvider });

    expect(switchTo(result.current, tenant.id)).toBe(false);

    expect(result.current.activeTenantId).toBeNull();
    expect(accessState.get().principal).toBeNull();
  });

  it('keeps one stable switchTenant identity across re-renders and state changes', () => {
    const { other } = seedMembership(ROLES.manager);
    const { result, rerender } = renderHook(() => useTenant(), { wrapper: AccessProvider });
    const initial: TenantContextValue['switchTenant'] = result.current.switchTenant;

    rerender();
    expect(result.current.switchTenant).toBe(initial);

    expect(switchTo(result.current, other.id)).toBe(true);

    expect(result.current.activeTenantId).toBe(other.id);
    expect(result.current.switchTenant).toBe(initial);
  });
});
