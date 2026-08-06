import { PERMISSIONS, ROLES } from '@/lib/access/permission-catalog';
import editContactPolicy, { EditContactPolicy } from '@/lib/access/policies/edit-contact-policy';
import type { Role } from '@/lib/types/access/permission';
import type { ContactSubject } from '@/lib/types/access/policy';
import type { Principal } from '@/lib/types/access/principal';
import { buildPrincipal, buildTenantRef, buildUserId } from '@tests/builders';

const tenant = buildTenantRef();

const buildMember = (roles: readonly Role[]): Principal =>
  buildPrincipal({ roles, tenantId: tenant.id, tenants: [tenant] });

const buildContact = (overrides: Partial<ContactSubject> = {}): ContactSubject => ({
  id: buildUserId(),
  tenantId: tenant.id,
  ownerId: buildUserId(),
  ...overrides,
});

describe('EditContactPolicy', () => {
  const policy = new EditContactPolicy();

  it('exports a shared singleton instance', () => {
    expect(editContactPolicy).toBeInstanceOf(EditContactPolicy);
  });

  it('guards the contact write permission', () => {
    expect(policy.permission).toBe(PERMISSIONS.contactWrite);
    expect(policy.permission).toBe('contact:write');
  });

  it('denies an owner from another tenant even when it holds every permission', () => {
    const principal = buildMember([ROLES.admin]);
    const foreign = buildContact({ tenantId: buildTenantRef().id, ownerId: principal.id });

    expect(principal.permissions).toContain(PERMISSIONS.contactWrite);
    expect(principal.permissions).toContain(PERMISSIONS.contactManageAll);
    expect(policy.isSatisfiedBy(principal, foreign)).toBe(false);
  });

  it('denies a same-tenant owner that lacks the contact write permission', () => {
    const principal = buildMember([ROLES.viewer]);

    expect(principal.permissions).not.toContain(PERMISSIONS.contactWrite);
    expect(policy.isSatisfiedBy(principal, buildContact({ ownerId: principal.id }))).toBe(false);
  });

  it('allows the owner of a contact in its own tenant', () => {
    const principal = buildMember([ROLES.member]);

    expect(principal.permissions).not.toContain(PERMISSIONS.contactManageAll);
    expect(policy.isSatisfiedBy(principal, buildContact({ ownerId: principal.id }))).toBe(true);
  });

  it('allows a non-owner holding the manage-all permission', () => {
    const principal = buildMember([ROLES.manager]);

    expect(principal.permissions).toContain(PERMISSIONS.contactManageAll);
    expect(policy.isSatisfiedBy(principal, buildContact())).toBe(true);
  });

  it('denies a non-owner without the manage-all permission', () => {
    const principal = buildMember([ROLES.member]);

    expect(principal.permissions).toContain(PERMISSIONS.contactWrite);
    expect(policy.isSatisfiedBy(principal, buildContact())).toBe(false);
  });
});
