import type { RegistrationView } from '@auth/components/form-section/types';

export type AuthNotificationFlow = 'signUp' | 'signIn';

export interface AuthNotificationCopy {
  readonly successTitle: string;
  readonly successDescription: string;
  readonly successButton: string;
  readonly submitting: string;
}

export interface ResolvedNotificationCopy extends AuthNotificationCopy {
  readonly errorText: string;
}

export interface AuthNotificationCopyTable {
  readonly signUp: AuthNotificationCopy;
  readonly signIn: AuthNotificationCopy;
}

export interface Props {
  view: Exclude<RegistrationView, 'form'>;
  flow?: AuthNotificationFlow | undefined;
  errorText?: string;
  isSubmitting: boolean;
  onShown?: () => void;
  onBack: () => void;
  onRetry?: (() => void) | undefined;
}
