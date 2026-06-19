import { injectable } from 'tsyringe';

import { LoginResponseSchema } from '@auth/utils/response-schemas';

import type { LoginResponseMappingResult } from './login-response-mapper.types';

const INVALID_LOGIN_RESPONSE_MESSAGE = 'Unexpected response from server';

@injectable()
export default class LoginResponseMapper {
  public map(apiResponse: unknown, email: string): LoginResponseMappingResult {
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
