import type { UiError } from '@/services/error';
import { injectable } from 'tsyringe';

import { RegistrationResponseSchema, type SafeUserInfo } from '@/modules/User/features/Auth/types/ApiResponses';

export type RegistrationResponseMappingResult =
  | { ok: true; value: SafeUserInfo }
  | { ok: false; error: UiError };

const INVALID_REGISTRATION_RESPONSE_MESSAGE =
  'There was a problem with the provided information. Please check your input.';

@injectable()
export default class RegistrationResponseMapper {
  public map(apiResponse: unknown): RegistrationResponseMappingResult {
    const parsed = RegistrationResponseSchema.safeParse(apiResponse);
    if (!parsed.success) {
      // Keep detailed validation diagnostics in logs while returning a safe user message.
      // eslint-disable-next-line no-console
      console.error('Registration response validation failed', parsed.error);
      return {
        ok: false,
        error: {
          displayMessage: INVALID_REGISTRATION_RESPONSE_MESSAGE,
          retryable: false,
        },
      };
    }

    return { ok: true, value: parsed.data };
  }
}
