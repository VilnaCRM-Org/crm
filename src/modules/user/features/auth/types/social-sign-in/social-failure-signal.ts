import type { AuthFailureReason } from '@/services/types/security-events/security-event';

export interface SocialFailureSignal {
  readonly kind: AuthFailureReason;
  readonly status?: number | undefined;
}
