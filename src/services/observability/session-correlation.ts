import { v4 as uuidv4 } from 'uuid';

import type { CorrelationIdHeader } from '@/services/types/observability/observability';

export class SessionCorrelation {
  public readonly header: CorrelationIdHeader = 'X-Correlation-Id';

  private readonly sessionId: string = uuidv4();

  public id(): string {
    return this.sessionId;
  }
}

const sessionCorrelation = new SessionCorrelation();

export default sessionCorrelation;
