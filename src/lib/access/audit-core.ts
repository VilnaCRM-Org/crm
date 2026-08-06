import type { AuditEventInput, AuditSink } from '@/lib/types/access/audit';

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
        ...input,
        at: new Date().toISOString(),
        principalId: principal?.id ?? null,
        tenantId: principal?.tenantId ?? null,
      });
    } catch (error) {
      console.error('Audit sink threw while recording an event', error);
    }
  }
}

const auditCore = new AuditCore();

export default auditCore;
