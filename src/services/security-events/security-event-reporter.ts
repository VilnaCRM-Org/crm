import { inject, injectable } from 'tsyringe';

import type {
  AuthFailureCategory,
  AuthFailureReason,
  SecurityEventRecorder,
} from '@/services/types/security-events/security-event';

import type { SecurityEventCore } from './security-event-core';
import SECURITY_EVENT_TOKENS from './tokens';

@injectable()
export default class SecurityEventReporter implements SecurityEventRecorder {
  constructor(
    @inject(SECURITY_EVENT_TOKENS.SecurityEventCore) private readonly core: SecurityEventCore
  ) {}

  public authFailure(category: AuthFailureCategory, reason: AuthFailureReason): void {
    this.core.authFailure(category, reason);
  }

  public unauthorizedResponse(status: number): void {
    this.core.unauthorizedResponse(status);
  }

  public boundaryCatch(surface: string): void {
    this.core.boundaryCatch(surface);
  }
}
