import accessState from '@/lib/access/access-state';
import auditCore, { AuditCore } from '@/lib/access/audit-core';
import noopAuditSink, { NoopAuditSink } from '@/lib/access/noop-audit-sink';
import correlationIdSource from '@/lib/observability/correlation-id-source';
import type { AuditEvent, AuditMetadata, AuditSink } from '@/lib/types/access/audit';
import { buildPrincipal } from '@tests/builders';

const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

const createSink = (): jest.Mocked<AuditSink> => ({ record: jest.fn() });

const recordedAt = (sink: jest.Mocked<AuditSink>, call = 0): AuditEvent => {
  const recorded = sink.record.mock.calls[call];
  if (recorded === undefined) throw new Error(`no audit event recorded at index ${call}`);
  return recorded[0];
};

describe('AuditCore', () => {
  let sink: jest.Mocked<AuditSink>;

  beforeEach(() => {
    accessState.clear();
    sink = createSink();
    auditCore.useSink(sink);
  });

  afterEach(() => {
    jest.useRealTimers();
    auditCore.useSink(noopAuditSink);
    accessState.clear();
  });

  it('is exported as a singleton instance of the class', () => {
    expect(auditCore).toBeInstanceOf(AuditCore);
  });

  it('records through the noop sink until one is registered', () => {
    const spy = jest.spyOn(NoopAuditSink.prototype, 'record');
    const isolated = new AuditCore();

    expect(() => isolated.log({ type: 'login' })).not.toThrow();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(sink.record).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  describe('log', () => {
    it('stamps an anonymous event with null identity and an ISO-8601 timestamp', () => {
      auditCore.log({ type: 'logout' });

      expect(sink.record).toHaveBeenCalledTimes(1);
      const event = recordedAt(sink);
      expect(event.type).toBe('logout');
      expect(event.metadata).toStrictEqual({ correlationId: expect.any(String) });
      expect(event.principalId).toBeNull();
      expect(event.tenantId).toBeNull();
      expect(event.at).toMatch(ISO_8601);
      expect(new Date(event.at).toISOString()).toBe(event.at);
    });

    it('stamps the exact current instant as the at field', () => {
      const now = new Date('2026-03-04T05:06:07.008Z');
      jest.useFakeTimers().setSystemTime(now);

      auditCore.log({ type: 'login' });

      expect(sink.record).toHaveBeenCalledWith({
        type: 'login',
        metadata: { correlationId: expect.any(String) },
        at: '2026-03-04T05:06:07.008Z',
        principalId: null,
        tenantId: null,
      });
    });

    it('stamps the principal id and tenant id from the current access state', () => {
      const principal = buildPrincipal();
      accessState.setSession(principal, {});

      auditCore.log({ type: 'tenant_switch' });

      const event = recordedAt(sink);
      expect(event.principalId).toBe(principal.id);
      expect(event.tenantId).toBe(principal.tenantId);
      expect(event.type).toBe('tenant_switch');
    });

    it('re-reads the access state on every call rather than caching it', () => {
      const principal = buildPrincipal();

      auditCore.log({ type: 'login' });
      accessState.setSession(principal, {});
      auditCore.log({ type: 'tenant_switch' });
      accessState.clear();
      auditCore.log({ type: 'logout' });

      expect(sink.record).toHaveBeenCalledTimes(3);
      expect(recordedAt(sink, 0).principalId).toBeNull();
      expect(recordedAt(sink, 0).tenantId).toBeNull();
      expect(recordedAt(sink, 1).principalId).toBe(principal.id);
      expect(recordedAt(sink, 1).tenantId).toBe(principal.tenantId);
      expect(recordedAt(sink, 2).principalId).toBeNull();
      expect(recordedAt(sink, 2).tenantId).toBeNull();
    });

    it('attributes an event to the caller-supplied subject over the published principal', () => {
      const published = buildPrincipal();
      accessState.setSession(published, {});
      const hydrating = buildPrincipal();

      auditCore.log({
        type: 'access_role_unmapped',
        metadata: { role: 'ROLE_GHOST' },
        subject: { principalId: hydrating.id, tenantId: hydrating.tenantId },
      });

      const event = recordedAt(sink);
      expect(event.principalId).toBe(hydrating.id);
      expect(event.tenantId).toBe(hydrating.tenantId);
      expect(event.principalId).not.toBe(published.id);
    });

    it('honours an explicit anonymous subject while a principal is published', () => {
      accessState.setSession(buildPrincipal(), {});

      auditCore.log({ type: 'logout', subject: { principalId: null, tenantId: null } });

      const event = recordedAt(sink);
      expect(event.principalId).toBeNull();
      expect(event.tenantId).toBeNull();
    });

    it('keeps the caller-supplied subject out of the recorded envelope', () => {
      const hydrating = buildPrincipal();

      auditCore.log({
        type: 'login',
        subject: { principalId: hydrating.id, tenantId: hydrating.tenantId },
      });

      expect(Object.keys(recordedAt(sink)).sort()).toEqual([
        'at',
        'metadata',
        'principalId',
        'tenantId',
        'type',
      ]);
    });

    it('passes the type and metadata through unchanged', () => {
      const principal = buildPrincipal();
      const metadata: AuditMetadata = {
        tenantId: principal.tenantId,
        permission: 'contact:write',
      };

      auditCore.log({ type: 'permission_denied', metadata });

      const event = recordedAt(sink);
      expect(event.type).toBe('permission_denied');
      expect(event.metadata).toStrictEqual({
        tenantId: principal.tenantId,
        permission: 'contact:write',
        correlationId: expect.any(String),
      });
      expect(event.metadata).not.toBe(metadata);
      expect(metadata).toStrictEqual({
        tenantId: principal.tenantId,
        permission: 'contact:write',
      });
    });

    it('emits exactly the stamped envelope keys, metadata included', () => {
      const principal = buildPrincipal();
      accessState.setSession(principal, {});

      auditCore.log({ type: 'login' });

      const event = recordedAt(sink);
      expect(Object.keys(event).sort()).toEqual([
        'at',
        'metadata',
        'principalId',
        'tenantId',
        'type',
      ]);
      expect(event.principalId).toBe(principal.id);
      expect(event.tenantId).toBe(principal.tenantId);
    });
  });

  describe('correlation id', () => {
    it('stamps a correlation id on an event that carries no metadata of its own', () => {
      auditCore.log({ type: 'login' });

      expect(recordedAt(sink).metadata).toStrictEqual({
        correlationId: correlationIdSource.current(),
      });
    });

    it('merges the id into existing metadata rather than replacing it', () => {
      auditCore.log({ type: 'permission_denied', metadata: { permission: 'contact:write' } });

      expect(recordedAt(sink).metadata).toStrictEqual({
        permission: 'contact:write',
        correlationId: correlationIdSource.current(),
      });
    });

    it('carries the same id across two events emitted in the same request scope', () => {
      auditCore.log({ type: 'login' });
      auditCore.log({ type: 'tenant_switch' });

      const first = recordedAt(sink, 0).metadata?.correlationId;
      expect(first).toEqual(expect.any(String));
      expect(recordedAt(sink, 1).metadata?.correlationId).toBe(first);
    });

    it('follows the source onto the next request scope', () => {
      auditCore.log({ type: 'login' });
      const rotated = correlationIdSource.next();
      auditCore.log({ type: 'logout' });

      expect(recordedAt(sink, 0).metadata?.correlationId).not.toBe(rotated);
      expect(recordedAt(sink, 1).metadata?.correlationId).toBe(rotated);
    });

    it('needs no installation step — a never-touched source still yields an id', () => {
      const isolated = new AuditCore();
      isolated.useSink(sink);

      isolated.log({ type: 'access_role_unmapped', metadata: { role: 'ROLE_GHOST' } });

      expect(recordedAt(sink).metadata).toStrictEqual({
        role: 'ROLE_GHOST',
        correlationId: correlationIdSource.current(),
      });
    });
  });

  describe('useSink', () => {
    it('routes subsequent events to the newly registered sink only', () => {
      const next = createSink();

      auditCore.useSink(next);
      auditCore.log({ type: 'login' });

      expect(next.record).toHaveBeenCalledTimes(1);
      expect(recordedAt(next).type).toBe('login');
      expect(sink.record).not.toHaveBeenCalled();
    });

    it('keeps events recorded before the swap on the previous sink', () => {
      auditCore.log({ type: 'login' });
      const next = createSink();
      auditCore.useSink(next);
      auditCore.log({ type: 'logout' });

      expect(sink.record).toHaveBeenCalledTimes(1);
      expect(recordedAt(sink).type).toBe('login');
      expect(next.record).toHaveBeenCalledTimes(1);
      expect(recordedAt(next).type).toBe('logout');
    });
  });

  describe('when the sink throws', () => {
    it('swallows the failure and reports it on the console', () => {
      const failure = new Error('audit sink offline');
      const throwing: jest.Mocked<AuditSink> = {
        record: jest.fn<void, [AuditEvent]>(() => {
          throw failure;
        }),
      };
      auditCore.useSink(throwing);
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => auditCore.log({ type: 'logout' })).not.toThrow();

      expect(throwing.record).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith('Audit sink threw while recording an event', failure);
      errorSpy.mockRestore();
    });

    it('keeps logging after a failed record', () => {
      const throwing: jest.Mocked<AuditSink> = {
        record: jest.fn<void, [AuditEvent]>(() => {
          throw new Error('transient');
        }),
      };
      auditCore.useSink(throwing);
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      auditCore.log({ type: 'login' });
      auditCore.log({ type: 'logout' });

      expect(throwing.record).toHaveBeenCalledTimes(2);
      expect(errorSpy).toHaveBeenCalledTimes(2);
      errorSpy.mockRestore();
    });
  });
});
