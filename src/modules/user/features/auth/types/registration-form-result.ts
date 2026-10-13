import type { SignUpDto } from '@/modules/user/types/user/sign-up-dto';
import type { RegistrationView } from '@auth/components/form-section/types';

export interface UseRegistrationFormResult {
  view: RegistrationView;
  errorText: string;
  formKey: number;
  isSubmitting: boolean;
  showSubmitLoader: boolean;
  handleRegister: (data: SignUpDto) => Promise<void>;
  handleSuccessShown: () => void;
  handleBackToForm: () => void;
  handleRetry: () => void;
}
