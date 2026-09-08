import correlationIdSource from '@/lib/observability/correlation-id-source';
import type { AuditEventInput, AuditMetadata, AuditSink } from '@/lib/types/access/audit';

import accessState from './access-state';
import noopAuditSink from './noop-audit-sink';

export class AuditCore {
  private sink: AuditSink = noopAuditSink;

  public useSink(sink: AuditSink): void {
    this.sink = sink;
  }

  public log(input: AuditEventInput): void {
    const { principal } = accessState.get();
    try {
      this.sink.record({
        type: input.type,
        metadata: this.withCorrelationId(input.metadata),
        at: new Date().toISOString(),
        principalId: principal?.id ?? null,
        tenantId: principal?.tenantId ?? null,
      });
    } catch (error) {
      console.error('Audit sink threw while recording an event', error);
    }
  }

  private withCorrelationId(metadata: AuditMetadata | undefined): AuditMetadata {
    return { ...metadata, correlationId: correlationIdSource.current() };
  }
}

const auditCore = new AuditCore();

export default auditCore;
