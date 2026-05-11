import { LoginUserDto, RegisterUserDto } from '@/modules/user/features/auth/types/credentials';

export type AuthMode = 'login' | 'register';
export type RegistrationView = 'form' | 'success' | 'error';
export type AuthVariants = LoginUserDto | RegisterUserDto;
