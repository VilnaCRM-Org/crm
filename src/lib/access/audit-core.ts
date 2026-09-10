import correlationIdSource from '@/lib/observability/correlation-id-source';
import type {
  AuditEventInput,
  AuditMetadata,
  AuditSink,
  AuditSubject,
} from '@/lib/types/access/audit';

import accessState from './access-state';
import noopAuditSink from './noop-audit-sink';

export class AuditCore {
  private sink: AuditSink = noopAuditSink;

  public useSink(sink: AuditSink): void {
    this.sink = sink;
  }

  public log(input: AuditEventInput): void {
    const subject = this.currentSubject();
    try {
      this.sink.record({
        type: input.type,
        metadata: this.withCorrelationId(input.metadata),
        at: new Date().toISOString(),
        principalId: subject.principalId,
        tenantId: subject.tenantId,
      });
    } catch (error) {
      console.error('Audit sink threw while recording an event', error);
    }
  }

  private currentSubject(): AuditSubject {
    const { principal } = accessState.get();
    return { principalId: principal?.id ?? null, tenantId: principal?.tenantId ?? null };
  }

  private withCorrelationId(metadata: AuditMetadata | undefined): AuditMetadata {
    return { ...metadata, correlationId: correlationIdSource.current() };
  }
}

const auditCore = new AuditCore();

export default auditCore;
