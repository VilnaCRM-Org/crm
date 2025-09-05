import { z } from 'zod';

export const LoginResponseSchema = z.object({ token: z.string() });

export type LoginResponse = z.infer<typeof LoginResponseSchema>;


export const RegistrationResponseSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  email: z.string().trim().email('Invalid email'),
});

export type SafeUserInfo = z.infer<typeof RegistrationResponseSchema>;

export interface RegistrationResponse {
  fullName: string;
  email: string;
}
