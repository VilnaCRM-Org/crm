import { faker } from '@faker-js/faker';

import type { Principal, TenantRef } from '@/lib/types/access/principal';
import type { SessionClaims } from '@/lib/types/access/session';

import { buildEmail } from './user';

// Roles are opaque, server-supplied strings (issue #114): the client keeps no catalog of them.
// These are sample names for tests that need a stable, readable role, not a contract.
export const SAMPLE_ROLES = Object.freeze({
  admin: 'admin',
  manager: 'manager',
  member: 'member',
  viewer: 'viewer',
} as const);

export function buildTenantRef(overrides: Partial<TenantRef> = {}): TenantRef {
  return { id: faker.string.uuid(), name: faker.company.name(), ...overrides };
}

export function buildPrincipal(overrides: Partial<Principal> = {}): Principal {
  const roles: readonly string[] = overrides.roles ?? [SAMPLE_ROLES.member];
  // The store enforces `tenantId ∈ tenants`, so a principal must never be built with an
  // active tenant it does not belong to: a pinned-empty membership gains the tenant that
  // ends up active, and a pinned tenantId is honoured only when it is a real membership.
  const pinned: readonly TenantRef[] = overrides.tenants ?? [buildTenantRef()];
  const [head] = pinned;
  const active: TenantRef = head ?? {
    id: overrides.tenantId ?? buildTenantRef().id,
    name: faker.company.name(),
  };
  const tenants: readonly TenantRef[] = head === undefined ? [active] : pinned;
  const requested: string | undefined = overrides.tenantId;
  const member: boolean = tenants.some((tenant) => tenant.id === requested);
  return {
    id: faker.string.uuid(),
    email: buildEmail(),
    roles,
    allowedMutations: [],
    ...overrides,
    tenantId: member ? (requested as string) : active.id,
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
    sid: faker.string.uuid(),
    email: buildEmail(),
    roles: [SAMPLE_ROLES.member],
    ...overrides,
    tenantId: requested ?? tenants.at(0)?.id,
    tenants,
  };
}
