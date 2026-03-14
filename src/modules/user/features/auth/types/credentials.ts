export interface RegisterUserDto {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginUserDto {
  email: string;
  password: string;
}
