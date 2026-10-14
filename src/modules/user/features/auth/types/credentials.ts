export interface RegisterUserDto {
  fullName: string;
  email: string;
  password: string;
}

export type LoginUserDto = Pick<RegisterUserDto, 'email' | 'password'>;
