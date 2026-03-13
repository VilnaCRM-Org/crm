import container from '@/config/DependencyInjectionConfig';
import TOKENS from '@/config/tokens';
import { ErrorHandler } from '@/services/error';
import { ErrorParser } from '@/utils/error';

import type LoginAPI from '@/modules/User/features/Auth/api/LoginAPI';
import { LoginResponseSchema } from '@/modules/User/features/Auth/types/ApiResponses';
import type { LoginUserDto } from '@/modules/User/features/Auth/types/Credentials';
import isAbortError from '@/modules/User/features/Auth/utils/isAbortError';

export type LoginResult =
  | { status: 'success'; email: string; token: string }
  | { status: 'error'; message: string }
  | { status: 'aborted' };

export async function login(credentials: LoginUserDto, signal?: AbortSignal): Promise<LoginResult> {
  try {
    const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
    const apiResponse = await loginAPI.login(credentials, { signal });
    const parsed = LoginResponseSchema.safeParse(apiResponse);

    if (!parsed.success) {
      return {
        status: 'error',
        message: parsed.error.issues.map((i) => i.message).join('; '),
      };
    }

    return {
      status: 'success',
      email: credentials.email.toLowerCase(),
      token: parsed.data.token,
    };
  } catch (err) {
    if (isAbortError(err)) {
      return { status: 'aborted' };
    }

    const parsedError = ErrorParser.parseHttpError(err);
    const apiError = ErrorHandler.handleAuthError(parsedError);

    return { status: 'error', message: apiError.displayMessage };
  }
}
