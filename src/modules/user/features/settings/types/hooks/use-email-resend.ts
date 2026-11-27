import type { NotificationDraftSet } from '@/lib/notifications/types/notification-draft';

import type { UserEntityAdoption } from './use-profile-load';

export interface EmailResend {
  readonly isSubmitting: boolean;
  readonly resend: () => void;
}

export interface ResendSettleContext {
  readonly email: string;
  readonly adoption: UserEntityAdoption;
  readonly issued: number;
  readonly raise: (drafts: NotificationDraftSet) => void;
}
