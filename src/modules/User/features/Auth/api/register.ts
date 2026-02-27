import container from '@/config/DependencyInjectionConfig';
import TOKENS from '@/config/tokens';
import { ErrorHandler } from '@/services/error';
import { ErrorParser } from '@/utils/error';

import { RegistrationResponseSchema } from '../types/ApiResponses';
import type { RegisterUserDto } from '../types/Credentials';
import { isAbortError } from '../utils/isAbortError';

import type RegistrationAPI from './RegistrationAPI';

export type RegisterResult =
  | { status: 'success' }
  | { status: 'error'; message: string }
  | { status: 'aborted' };

export async function register(
  credentials: RegisterUserDto,
  signal?: AbortSignal
): Promise<RegisterResult> {
  try {
    const registrationAPI = container.resolve<RegistrationAPI>(TOKENS.RegistrationAPI);
    const apiResponse = await registrationAPI.register(credentials, { signal });
    const parsed = RegistrationResponseSchema.safeParse(apiResponse);

    if (!parsed.success) {
      return {
        status: 'error',
        message: parsed.error.issues.map((i) => i.message).join('; '),
      };
    }

    return { status: 'success' };
  } catch (err) {
    if (isAbortError(err)) {
      return { status: 'aborted' };
    }

    const parsedError = ErrorParser.parseHttpError(err);
    const apiError = ErrorHandler.handleAuthError(parsedError);

    return { status: 'error', message: apiError.displayMessage };
  }
}
