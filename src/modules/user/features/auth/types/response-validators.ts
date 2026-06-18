import { injectable } from 'tsyringe';
import { z } from 'zod';

import {
  LoginResponseSchema,
  RegistrationResponseSchema,
  type LoginResponse,
  type RegistrationResponse,
} from '@auth/types/api-responses';

export type ValidationResult<T> = { success: true; data: T } | { success: false; errors: string[] };

type SafeParseLike<T> = { success: true; data: T } | { success: false; error: z.ZodError };

@injectable()
export default class ResponseValidators {
  public validateLogin(value: unknown): ValidationResult<LoginResponse> {
    return this.toValidationResult(LoginResponseSchema.safeParse(value));
  }

  public validateRegistration(value: unknown): ValidationResult<RegistrationResponse> {
    return this.toValidationResult(RegistrationResponseSchema.safeParse(value));
  }

  private toValidationResult<T>(parsed: SafeParseLike<T>): ValidationResult<T> {
    if (parsed.success) {
      return { success: true, data: parsed.data };
    }

    return { success: false, errors: parsed.error.issues.map((issue) => this.formatIssue(issue)) };
  }

  private formatIssue(issue: z.ZodIssue): string {
    const pathLabel = issue.path.join('.') || 'value';

    if (issue.code === 'invalid_type') {
      return `${pathLabel}: expected ${issue.expected}`;
    }

    return `${pathLabel}: ${issue.message}`;
  }
}
