import { injectable } from 'tsyringe';

import type { LoginMappingResult } from '@/modules/user/types/store/login-mapper';
import { LoginResponseSchema } from '@auth';

const INVALID_LOGIN_RESPONSE_MESSAGE = 'Unexpected response from server';

@injectable()
export default class LoginResponseMapper {
  public map(apiResponse: unknown, email: string): LoginMappingResult {
    const parsed = LoginResponseSchema.safeParse(apiResponse);
    if (!parsed.success) {
      return {
        ok: false,
        error: {
          displayMessage: INVALID_LOGIN_RESPONSE_MESSAGE,
          retryable: false,
        },
      };
    }

    return {
      ok: true,
      value: { ...parsed.data, email: email.toLowerCase() },
    };
  }
}
