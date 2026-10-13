import type { SignInDto } from '@/modules/user/types/user/sign-in-dto';
import type { SignUpDto } from '@/modules/user/types/user/sign-up-dto';

export type RegistrationView = 'form' | 'success' | 'error';
export type AuthVariants = SignInDto | SignUpDto;
