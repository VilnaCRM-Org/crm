import type { TFunction } from 'i18next';

import type { ToastQueue } from '@/components/types/ui-toast';

import type { UserEntityAdoption } from './use-profile-load';

export interface EmailResend {
  readonly isSubmitting: boolean;
  readonly resend: () => void;
}

export interface ResendSettleContext {
  readonly adoption: UserEntityAdoption;
  readonly toasts: ToastQueue;
  readonly t: TFunction;
}
