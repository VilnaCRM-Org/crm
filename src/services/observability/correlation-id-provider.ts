import correlationIdSource from '@/lib/observability/correlation-id-source';

export class CorrelationIdProvider {
  public readonly header: string = 'X-Request-Id';

  public currentId: string = '';

  public next(): string {
    this.currentId = correlationIdSource.next();
    return this.currentId;
  }
}

const correlationIdProvider = new CorrelationIdProvider();

export default correlationIdProvider;
