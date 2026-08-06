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
  const tenants: readonly TenantRef[] = overrides.tenants ?? [buildTenantRef()];
  return {
    id: faker.string.uuid(),
    email: buildEmail(),
    roles,
    permissions: permissionResolver.expand(roles),
    tenantId: tenants[0].id,
    tenants,
    ...overrides,
  };
}

export function encodeSegment(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export function buildAccessToken(claims: SessionClaims | Record<string, unknown> = {}): string {
  return `${encodeSegment({ alg: 'none', typ: 'JWT' })}.${encodeSegment(claims)}.signature`;
}

export function buildClaims(overrides: Partial<SessionClaims> = {}): SessionClaims {
  const tenant = buildTenantRef();
  return {
    sub: faker.string.uuid(),
    email: buildEmail(),
    roles: [ROLES.member],
    tenantId: tenant.id,
    tenants: [tenant],
    ...overrides,
  };
}
