import { v4 as uuidv4 } from 'uuid';

export class CorrelationIdProvider {
  public readonly header: string = 'X-Request-Id';

  public currentId: string = '';

  public next(): string {
    this.currentId = uuidv4();
    return this.currentId;
  }
}

const correlationIdProvider = new CorrelationIdProvider();

export default correlationIdProvider;
