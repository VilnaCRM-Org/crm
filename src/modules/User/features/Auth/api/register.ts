import container from '@/config/DependencyInjectionConfig';
import TOKENS from '@/config/tokens';
import { ErrorHandler } from '@/services/error';
import { ErrorParser } from '@/utils/error';

import type RegistrationAPI from '@/modules/User/features/Auth/api/RegistrationAPI';
import { RegistrationResponseSchema } from '@/modules/User/features/Auth/types/ApiResponses';
import type { RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';
import isAbortError from '@/modules/User/features/Auth/utils/isAbortError';
import isAPIError from '@/modules/User/helpers/isAPIError';

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

    if (isAPIError(err)) {
      const apiError = ErrorHandler.handleAuthError(err);
      return { status: 'error', message: apiError.displayMessage };
    }

    const parsedError = ErrorParser.parseHttpError(err);
    const apiError = ErrorHandler.handleAuthError(parsedError);

    return { status: 'error', message: apiError.displayMessage };
  }
}
