import type { LoginUserDto, RegisterUserDto } from '@auth/types/credentials';

export type RegistrationView = 'form' | 'success' | 'error';
export type AuthVariants = LoginUserDto | RegisterUserDto;
