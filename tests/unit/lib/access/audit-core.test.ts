import accessState from '@/lib/access/access-state';
import auditCore, { AuditCore } from '@/lib/access/audit-core';
import noopAuditSink, { NoopAuditSink } from '@/lib/access/noop-audit-sink';
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
      expect(event.metadata).toBeUndefined();
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

    it('passes the type and metadata through unchanged', () => {
      const principal = buildPrincipal();
      const metadata: AuditMetadata = {
        tenantId: principal.tenantId,
        permission: 'contact:write',
      };

      auditCore.log({ type: 'permission_denied', metadata });

      const event = recordedAt(sink);
      expect(event.type).toBe('permission_denied');
      expect(event.metadata).toEqual({
        tenantId: principal.tenantId,
        permission: 'contact:write',
      });
      expect(event.metadata).toBe(metadata);
    });

    // `AuditEventInput` structurally admits only `type` and `metadata`, so the stamped
    // fields cannot be overridden by a caller — what is worth pinning is the envelope the
    // core emits: exactly the stamped keys, and `metadata` omitted when none was given.
    it('emits exactly the stamped envelope keys and omits an absent metadata', () => {
      const principal = buildPrincipal();
      accessState.setSession(principal, {});

      auditCore.log({ type: 'login' });

      const event = recordedAt(sink);
      expect(Object.keys(event).sort()).toEqual(['at', 'principalId', 'tenantId', 'type']);
      expect(event.principalId).toBe(principal.id);
      expect(event.tenantId).toBe(principal.tenantId);
      expect('metadata' in event).toBe(false);
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
