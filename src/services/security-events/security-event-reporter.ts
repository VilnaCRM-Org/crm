import { injectable } from 'tsyringe';

import type {
  AuthFailureCategory,
  AuthFailureReason,
  SecurityEventRecorder,
} from '@/services/types/security-events/security-event';

import securityEventCore from './security-event-core';

@injectable()
export default class SecurityEventReporter implements SecurityEventRecorder {
  public authFailure(category: AuthFailureCategory, reason: AuthFailureReason): void {
    securityEventCore.authFailure(category, reason);
  }

  public unauthorizedResponse(status: number): void {
    securityEventCore.unauthorizedResponse(status);
  }

  public boundaryCatch(surface: string): void {
    securityEventCore.boundaryCatch(surface);
  }
}
