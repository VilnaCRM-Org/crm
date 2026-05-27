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

type ValidationResult<T> = { success: true; data: T } | { success: false; errors: string[] };

type SafeParseLike<T> = { success: true; data: T } | { success: false; error: z.ZodError };

const formatIssue = (issue: z.ZodIssue): string => {
  const pathLabel = issue.path.join('.') || 'value';

  if (issue.code === 'invalid_type') {
    return `${pathLabel}: expected ${issue.expected}`;
  }

  return `${pathLabel}: ${issue.message}`;
};

const toValidationResult = <T>(parsed: SafeParseLike<T>): ValidationResult<T> => {
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }

  return {
    success: false,
    errors: parsed.error.issues.map(formatIssue),
  };
};

export const validateLoginResponse = (value: unknown): ValidationResult<LoginResponse> =>
  toValidationResult(LoginResponseSchema.safeParse(value));

export const validateRegistrationResponse = (
  value: unknown
): ValidationResult<RegistrationResponse> =>
  toValidationResult(RegistrationResponseSchema.safeParse(value));
