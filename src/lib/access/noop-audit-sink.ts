import type { AuditSink } from '@/lib/types/access/audit';

export class NoopAuditSink implements AuditSink {
  public record(): void {
    /* the default sink deliberately drops events; deployments register a real sink */
  }
}

const noopAuditSink = new NoopAuditSink();

export default noopAuditSink;
