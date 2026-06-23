import type {
  EmailAlreadyUsedKey,
  GenericSignupErrorKey,
  MessageKey,
} from './map-registration-error.types';

export const EMAIL_ALREADY_USED_KEY: EmailAlreadyUsedKey = 'sign_up.errors.email_used';
export const GENERIC_SIGNUP_ERROR_KEY: GenericSignupErrorKey = 'sign_up.errors.signup_error';

const ERROR_PATTERNS = [
  { keys: ['email', 'exists'] as const, messageKey: EMAIL_ALREADY_USED_KEY },
] as const;

class RegistrationErrorMapper {
  public map(rawError: string | null | undefined): MessageKey | null {
    if (!rawError) return null;

    const haystack = rawError.toLowerCase();
    const matchedPattern = ERROR_PATTERNS.find(({ keys }) =>
      keys.every((key) => haystack.includes(key.toLowerCase()))
    );

    return matchedPattern ? matchedPattern.messageKey : GENERIC_SIGNUP_ERROR_KEY;
  }
}

export default new RegistrationErrorMapper();
