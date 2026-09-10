import { v4 as uuidv4 } from 'uuid';

export class CorrelationIdSource {
  private id: string = '';

  public current(): string {
    if (this.id === '') this.id = uuidv4();
    return this.id;
  }

  public next(): string {
    this.id = uuidv4();
    return this.id;
  }
}

const correlationIdSource = new CorrelationIdSource();

export default correlationIdSource;
