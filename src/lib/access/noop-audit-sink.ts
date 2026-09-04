import type { AuditSink } from '@/lib/types/access/audit';

export class NoopAuditSink implements AuditSink {
  public record(): void {}
}

const noopAuditSink = new NoopAuditSink();

export default noopAuditSink;
