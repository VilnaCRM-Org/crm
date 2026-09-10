import noopAuditSink, { NoopAuditSink } from '@/lib/access/noop-audit-sink';
import type { AuditEvent, AuditSink } from '@/lib/types/access/audit';
import { buildPrincipal } from '@tests/builders';

describe('NoopAuditSink', () => {
  const principal = buildPrincipal();
  const event: AuditEvent = {
    type: 'login',
    metadata: { tenantId: principal.tenantId },
    at: '2026-03-04T05:06:07.008Z',
    principalId: principal.id,
    tenantId: principal.tenantId,
  };

  it('is exported as a singleton instance of the class', () => {
    expect(noopAuditSink).toBeInstanceOf(NoopAuditSink);
  });

  it('drops the event without throwing and returns undefined', () => {
    const sink: AuditSink = noopAuditSink;

    expect(() => sink.record(event)).not.toThrow();
    expect(sink.record(event)).toBeUndefined();
  });

  it('drops events from a freshly constructed sink too', () => {
    const sink: AuditSink = new NoopAuditSink();

    expect(sink.record(event)).toBeUndefined();
  });

  it('leaves the recorded event untouched', () => {
    const sink: AuditSink = noopAuditSink;

    sink.record(event);

    expect(event).toEqual({
      type: 'login',
      metadata: { tenantId: principal.tenantId },
      at: '2026-03-04T05:06:07.008Z',
      principalId: principal.id,
      tenantId: principal.tenantId,
    });
  });
});
