export type LoginResponse = {
  token: string;
};

export type RegistrationResponse = {
  fullName?: string;
  email?: string;
};

export type SafeUserInfo = RegistrationResponse;

type ValidationResult<T> = { success: true; data: T } | { success: false; errors: string[] };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const validateLoginResponse = (value: unknown): ValidationResult<LoginResponse> => {
  if (!isObject(value)) {
    return { success: false, errors: ['token: expected string'] };
  }

  if (typeof value.token !== 'string') {
    return { success: false, errors: ['token: expected string'] };
  }

  return { success: true, data: { token: value.token } };
};

export const validateRegistrationResponse = (
  value: unknown
): ValidationResult<RegistrationResponse> => {
  if (!isObject(value)) {
    return {
      success: false,
      errors: ['value: expected object'],
    };
  }

  const errors: string[] = [];

  if ('fullName' in value && value.fullName !== undefined && typeof value.fullName !== 'string') {
    errors.push('fullName: expected string');
  }

  if ('email' in value && value.email !== undefined && typeof value.email !== 'string') {
    errors.push('email: expected string');
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      ...(typeof value.fullName === 'string' ? { fullName: value.fullName } : {}),
      ...(typeof value.email === 'string' ? { email: value.email } : {}),
    },
  };
};
