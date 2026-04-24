import type { UiError } from '@/services/error';
import { injectable } from 'tsyringe';

import { LoginResponseSchema, type LoginResponse } from '@/modules/User/features/Auth/types/ApiResponses';

export type LoginSuccessPayload = LoginResponse & { email: string };

export type LoginResponseMappingResult =
  | { ok: true; value: LoginSuccessPayload }
  | { ok: false; error: UiError };

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
