import type { RegistrationView } from '@auth/components/form-section/types';

export interface Props {
  view: Exclude<RegistrationView, 'form'>;
  errorText?: string;
  isSubmitting: boolean;
  onShown?: () => void;
  onBack: () => void;
  onRetry?: (() => void) | undefined;
}
