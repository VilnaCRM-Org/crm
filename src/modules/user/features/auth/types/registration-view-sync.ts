import type { RegistrationView } from '@auth/components/form-section/types';

import type { SafeUserInfo } from './api-responses';

export interface Params {
  user: SafeUserInfo | null;
  error: string | null | undefined;
  isSubmitting: boolean;
  setView: (view: RegistrationView) => void;
}
