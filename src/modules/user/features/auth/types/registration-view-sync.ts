import type { RegistrationView } from '@auth/components/form-section/types';

export interface Params {
  user: unknown;
  error: string | null | undefined;
  isSubmitting: boolean;
  setView: (view: RegistrationView) => void;
}
