import type { SignInDto } from '@/modules/user/types/user/sign-in-dto';

export interface LoginSubmitter {
  error: string;
  isSubmitting: boolean;
  handleLogin: (data: SignInDto) => Promise<void>;
  handleRetry: () => void;
  handleBack: () => void;
}
