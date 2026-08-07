import { faker } from '@faker-js/faker';

import { ROLES } from '@/lib/access/permission-catalog';
import permissionResolver from '@/lib/access/permission-resolver';
import type { Role } from '@/lib/types/access/permission';
import type { Principal, TenantRef } from '@/lib/types/access/principal';
import type { SessionClaims } from '@/lib/types/access/session';

import { buildEmail } from './user';

export function buildTenantRef(overrides: Partial<TenantRef> = {}): TenantRef {
  return { id: faker.string.uuid(), name: faker.company.name(), ...overrides };
}

export function buildPrincipal(overrides: Partial<Principal> = {}): Principal {
  const roles: readonly Role[] = overrides.roles ?? [ROLES.member];
  // The store enforces `tenantId ∈ tenants`, so a principal must never be built with an
  // active tenant it does not belong to: a pinned-empty membership gains the tenant that
  // ends up active, and a pinned tenantId is honoured only when it is a real membership.
  const pinned: readonly TenantRef[] = overrides.tenants ?? [buildTenantRef()];
  const tenants: readonly TenantRef[] =
    pinned.length > 0
      ? pinned
      : [{ id: overrides.tenantId ?? buildTenantRef().id, name: faker.company.name() }];
  const requested: string | undefined = overrides.tenantId;
  const member: boolean = tenants.some((tenant) => tenant.id === requested);
  return {
    id: faker.string.uuid(),
    email: buildEmail(),
    roles,
    permissions: permissionResolver.expand(roles),
    ...overrides,
    tenantId: member ? (requested as string) : tenants[0].id,
    tenants,
  };
}

export function encodeSegment(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export function buildAccessToken(claims: SessionClaims | Record<string, unknown> = {}): string {
  return `${encodeSegment({ alg: 'none', typ: 'JWT' })}.${encodeSegment(claims)}.signature`;
}

// SessionFactory rewrites an active tenant that is not a membership back to the first one, so
// claims built with a pinned tenantId and an unrelated tenant list would round-trip into a
// principal the test never asked for. Claims are reconciled the same way a principal is: a
// pinned tenantId is honoured by gaining it as a membership, never by being silently dropped.
export function buildClaims(overrides: Partial<SessionClaims> = {}): SessionClaims {
  const pinned: readonly TenantRef[] = overrides.tenants ?? [buildTenantRef()];
  const requested: string | undefined = overrides.tenantId;
  const member: boolean = pinned.some((tenant) => tenant.id === requested);
  const tenants: readonly TenantRef[] =
    requested === undefined || member
      ? pinned
      : [{ id: requested, name: faker.company.name() }, ...pinned];
  return {
    sub: faker.string.uuid(),
    email: buildEmail(),
    roles: [ROLES.member],
    ...overrides,
    tenantId: requested ?? tenants.at(0)?.id,
    tenants,
  };
}
