import type { RegistrationView } from '@auth/components/form-section/types';

export type RegistrationNotificationProps = {
  view: Exclude<RegistrationView, 'form'>;
  errorText?: string;
  isSubmitting: boolean;
  onShown?: () => void;
  onBack: () => void;
  onRetry?: () => void;
};
