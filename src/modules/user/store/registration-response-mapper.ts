import { injectable } from 'tsyringe';

import type { RegistrationResponseMappingResult } from '@/modules/user/types/store/registration-response-mapper';
import { RegistrationResponseSchema } from '@auth/utils/response-schemas';

const INVALID_REGISTRATION_RESPONSE_MESSAGE =
  'There was a problem with the provided information. Please check your input.';

@injectable()
export default class RegistrationResponseMapper {
  public map(apiResponse: unknown): RegistrationResponseMappingResult {
    const parsed = RegistrationResponseSchema.safeParse(apiResponse);
    if (!parsed.success) {
      // Log only a non-PII summary; schema errors can echo user-provided values.

      console.error('Registration response validation failed', {
        issueCount: parsed.error.issues.length,
      });
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
