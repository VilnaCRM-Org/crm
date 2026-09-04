import accessCore from '@/lib/access/access-core';
import accessState from '@/lib/access/access-state';
import auditCore from '@/lib/access/audit-core';
import noopAuditSink from '@/lib/access/noop-audit-sink';
import { PERMISSIONS, ROLES } from '@/lib/access/permission-catalog';
import { EditContactPolicy } from '@/lib/access/policies/edit-contact-policy';
import type { AuditSink } from '@/lib/types/access/audit';
import type { ContactSubject, Policy } from '@/lib/types/access/policy';
import PolicyEvaluator from '@/services/access/policy-evaluator';
import { buildPrincipal, buildTenantRef } from '@tests/builders';

const FROZEN_AT = '2026-03-04T05:06:07.008Z';

function buildContact(overrides: Partial<ContactSubject> = {}): ContactSubject {
  return {
    id: buildTenantRef().id,
    tenantId: buildTenantRef().id,
    ownerId: buildPrincipal().id,
    ...overrides,
  };
}

describe('PolicyEvaluator', () => {
  const evaluator = new PolicyEvaluator(accessCore);
  const editContact = new EditContactPolicy();
  const record = jest.fn();
  const sink: AuditSink = { record };

  beforeAll(() => {
    jest.useFakeTimers({ now: new Date(FROZEN_AT) });
  });

  afterAll(() => {
    jest.useRealTimers();
    auditCore.useSink(noopAuditSink);
  });

  beforeEach(() => {
    auditCore.useSink(sink);
  });

  afterEach(() => {
    accessState.clear();
  });

  describe('with nobody signed in', () => {
    it('returns false without consulting the policy and records a denial', () => {
      const isSatisfiedBy = jest.fn(() => true);
      const policy: Policy<ContactSubject> = { permission: PERMISSIONS.dealWrite, isSatisfiedBy };
      const subject = buildContact();

      expect(evaluator.evaluate(policy, subject)).toBe(false);
      expect(isSatisfiedBy).not.toHaveBeenCalled();
      expect(record).toHaveBeenCalledTimes(1);
      expect(record).toHaveBeenCalledWith({
        type: 'permission_denied',
        metadata: { permission: PERMISSIONS.dealWrite },
        at: FROZEN_AT,
        principalId: null,
        tenantId: null,
      });
    });

    it('records the permission of the real edit-contact policy', () => {
      expect(evaluator.evaluate(editContact, buildContact())).toBe(false);
      expect(record).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: { permission: PERMISSIONS.contactWrite } })
      );
    });
  });

  describe('when the policy rejects', () => {
    it('returns false and records a denial for a contact in another tenant', () => {
      const principal = buildPrincipal({ roles: [ROLES.admin] });
      accessState.setSession(principal, {});
      const subject = buildContact({ ownerId: principal.id, tenantId: buildTenantRef().id });

      expect(evaluator.evaluate(editContact, subject)).toBe(false);
      expect(record).toHaveBeenCalledTimes(1);
      expect(record).toHaveBeenCalledWith({
        type: 'permission_denied',
        metadata: { permission: PERMISSIONS.contactWrite },
        at: FROZEN_AT,
        principalId: principal.id,
        tenantId: principal.tenantId,
      });
    });

    it('returns false for a member editing a contact it does not own', () => {
      const principal = buildPrincipal({ roles: [ROLES.member] });
      accessState.setSession(principal, {});
      const subject = buildContact({ tenantId: principal.tenantId });

      expect(evaluator.evaluate(editContact, subject)).toBe(false);
      expect(record).toHaveBeenCalledTimes(1);
    });

    it('returns false for a viewer that lacks the write permission entirely', () => {
      const principal = buildPrincipal({ roles: [ROLES.viewer] });
      accessState.setSession(principal, {});
      const subject = buildContact({ tenantId: principal.tenantId, ownerId: principal.id });

      expect(evaluator.evaluate(editContact, subject)).toBe(false);
      expect(record).toHaveBeenCalledTimes(1);
    });

    it('returns false and records a denial when a stub policy rejects', () => {
      const principal = buildPrincipal({ roles: [ROLES.admin] });
      accessState.setSession(principal, {});
      const isSatisfiedBy = jest.fn(() => false);
      const policy: Policy<ContactSubject> = {
        permission: PERMISSIONS.adminManageUsers,
        isSatisfiedBy,
      };
      const subject = buildContact();

      expect(evaluator.evaluate(policy, subject)).toBe(false);
      expect(isSatisfiedBy).toHaveBeenCalledTimes(1);
      expect(record).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: { permission: PERMISSIONS.adminManageUsers } })
      );
    });
  });

  describe('when the policy accepts', () => {
    it('returns true and records nothing for an owner in the same tenant', () => {
      const principal = buildPrincipal({ roles: [ROLES.member] });
      accessState.setSession(principal, {});
      const subject = buildContact({ tenantId: principal.tenantId, ownerId: principal.id });

      expect(evaluator.evaluate(editContact, subject)).toBe(true);
      expect(record).not.toHaveBeenCalled();
    });

    it('returns true and records nothing for a manager with contact:manage-all', () => {
      const principal = buildPrincipal({ roles: [ROLES.manager] });
      accessState.setSession(principal, {});
      const subject = buildContact({ tenantId: principal.tenantId });

      expect(evaluator.evaluate(editContact, subject)).toBe(true);
      expect(record).not.toHaveBeenCalled();
    });

    it('hands the signed-in principal and the subject to the policy', () => {
      const principal = buildPrincipal({ roles: [ROLES.viewer] });
      accessState.setSession(principal, {});
      const isSatisfiedBy = jest.fn(() => true);
      const policy: Policy<ContactSubject> = { permission: PERMISSIONS.dealWrite, isSatisfiedBy };
      const subject = buildContact();

      expect(evaluator.evaluate(policy, subject)).toBe(true);
      expect(isSatisfiedBy).toHaveBeenCalledTimes(1);
      expect(isSatisfiedBy).toHaveBeenCalledWith(principal, subject);
      expect(record).not.toHaveBeenCalled();
    });
  });
});
