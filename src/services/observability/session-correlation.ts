import { v4 as uuidv4 } from 'uuid';

export class SessionCorrelation {
  public readonly header: string = 'X-Correlation-Id';

  private readonly sessionId: string = uuidv4();

  public id(): string {
    return this.sessionId;
  }
}

const sessionCorrelation = new SessionCorrelation();

export default sessionCorrelation;
