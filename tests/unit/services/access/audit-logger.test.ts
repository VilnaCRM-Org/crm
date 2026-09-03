import accessState from '@/lib/access/access-state';
import auditCore from '@/lib/access/audit-core';
import noopAuditSink from '@/lib/access/noop-audit-sink';
import { PERMISSIONS, ROLES } from '@/lib/access/permission-catalog';
import type { AuditSink } from '@/lib/types/access/audit';
import AuditLogger from '@/services/access/audit-logger';
import { buildPrincipal } from '@tests/builders';

const FROZEN_AT = '2026-02-03T04:05:06.007Z';

describe('AuditLogger', () => {
  const logger = new AuditLogger(auditCore);
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

  it('reaches the sink with the event stamped for the signed-in principal', () => {
    const principal = buildPrincipal({ roles: [ROLES.member] });
    accessState.setSession(principal, {});

    logger.log({ type: 'login' });

    expect(record).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledWith({
      type: 'login',
      at: FROZEN_AT,
      principalId: principal.id,
      tenantId: principal.tenantId,
    });
  });

  it('stamps a null principal and tenant while nobody is signed in', () => {
    logger.log({ type: 'logout' });

    expect(record).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledWith({
      type: 'logout',
      at: FROZEN_AT,
      principalId: null,
      tenantId: null,
    });
  });

  it('forwards the metadata of the event untouched', () => {
    const principal = buildPrincipal({ roles: [ROLES.viewer] });
    accessState.setSession(principal, {});

    logger.log({ type: 'permission_denied', metadata: { permission: PERMISSIONS.contactWrite } });

    expect(record).toHaveBeenCalledWith({
      type: 'permission_denied',
      metadata: { permission: PERMISSIONS.contactWrite },
      at: FROZEN_AT,
      principalId: principal.id,
      tenantId: principal.tenantId,
    });
  });

  it('records one sink event per call and returns nothing', () => {
    expect(logger.log({ type: 'login' })).toBeUndefined();
    logger.log({ type: 'logout' });

    expect(record).toHaveBeenCalledTimes(2);
    expect(record).toHaveBeenNthCalledWith(1, expect.objectContaining({ type: 'login' }));
    expect(record).toHaveBeenNthCalledWith(2, expect.objectContaining({ type: 'logout' }));
  });

  it('stamps the principal that is current at call time, not at construction time', () => {
    const first = buildPrincipal({ roles: [ROLES.member] });
    accessState.setSession(first, {});
    logger.log({ type: 'login' });

    const second = buildPrincipal({ roles: [ROLES.admin] });
    accessState.setSession(second, {});
    logger.log({ type: 'tenant_switch', metadata: { tenantId: second.tenantId } });

    expect(record).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ principalId: first.id, tenantId: first.tenantId })
    );
    expect(record).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ principalId: second.id, tenantId: second.tenantId })
    );
  });
});
