import type { AuditEventInput, AuditMetadata, AuditSink } from '@/lib/types/access/audit';

import accessState from './access-state';
import noopAuditSink from './noop-audit-sink';

export class AuditCore {
  private sink: AuditSink = noopAuditSink;

  public useSink(sink: AuditSink): void {
    this.sink = sink;
  }

  public useCorrelationIdProvider(provider: () => string | undefined): void {
    this.correlationIdProvider = provider;
  }

  public log(input: AuditEventInput): void {
    const { principal } = accessState.get();
    const metadata = this.withCorrelationId(input.metadata);
    const envelope: AuditEventInput =
      metadata === undefined ? { type: input.type } : { type: input.type, metadata };
    try {
      this.sink.record({
        ...envelope,
        at: new Date().toISOString(),
        principalId: principal?.id ?? null,
        tenantId: principal?.tenantId ?? null,
      });
    } catch (error) {
      console.error('Audit sink threw while recording an event', error);
    }
  }

  // The provider is untrusted external code wired in from outside the access domain (issue
  // #114 delta, FR-24): defaulting to "no id" keeps every existing caller's envelope
  // unchanged until something installs a real one.
  private correlationIdProvider: () => string | undefined = () => undefined;

  private withCorrelationId(metadata: AuditMetadata | undefined): AuditMetadata | undefined {
    const correlationId = this.currentCorrelationId();
    return correlationId === undefined ? metadata : { ...metadata, correlationId };
  }

  // A throwing provider must degrade to "no id", never break the caller's flow or lose the
  // event itself.
  private currentCorrelationId(): string | undefined {
    try {
      return this.correlationIdProvider();
    } catch {
      return undefined;
    }
  }
}

const auditCore = new AuditCore();

export default auditCore;
