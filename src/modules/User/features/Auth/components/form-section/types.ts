import { LoginUserDto, RegisterUserDto } from '@auth/types/Credentials';

export type AuthMode = 'login' | 'register';
export type RegistrationView = 'form' | 'success' | 'error';
export type AuthVariants = LoginUserDto | RegisterUserDto;
