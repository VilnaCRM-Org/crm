import type { RegistrationView } from '@auth/components/form-section/types';
import type { RegisterUserDto } from '@auth/types/credentials';

export interface UseRegistrationFormResult {
  view: RegistrationView;
  errorText: string;
  formKey: number;
  isSubmitting: boolean;
  showSubmitLoader: boolean;
  handleRegister: (data: RegisterUserDto) => Promise<void>;
  handleSuccessShown: () => void;
  handleBackToForm: () => void;
  handleRetry: () => void;
}
