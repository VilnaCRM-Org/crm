import { z } from 'zod';

export const LoginResponseSchema = z.object({ token: z.string() });

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const RegistrationResponseSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().optional(),

  // TODO: Reintroduce `fullName` and `email` fields once the backend includes them in the response.
  //       When re-enabled, update client-side validation and field-level error display accordingly.
  // fullName: z.string().trim().min(1, 'Full name is required'),
  // email: z.string().trim().email('Invalid email'),
});

export type RegistrationResponse = z.infer<typeof RegistrationResponseSchema>;
export type SafeUserInfo = RegistrationResponse;
