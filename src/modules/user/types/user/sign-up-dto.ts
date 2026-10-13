import type { SignInDto } from './sign-in-dto';

export interface SignUpDto extends SignInDto {
  readonly fullName: string;
}
