export const EMAIL_ALREADY_USED_KEY = 'sign_up.errors.email_used' as const;
export const GENERIC_SIGNUP_ERROR_KEY = 'sign_up.errors.signup_error' as const;

type MessageKey = typeof EMAIL_ALREADY_USED_KEY | typeof GENERIC_SIGNUP_ERROR_KEY;

const ERROR_PATTERNS = [
  { keys: ['email', 'exists'] as const, messageKey: EMAIL_ALREADY_USED_KEY },
] as const;

const getRegistrationError = (rawError: string | null | undefined): MessageKey | null => {
  if (!rawError) return null;

  const haystack = rawError.toLowerCase();
  const matchedPattern = ERROR_PATTERNS.find(({ keys }) =>
    keys.every((key) => haystack.includes(key.toLowerCase()))
  );

  return matchedPattern ? matchedPattern.messageKey : GENERIC_SIGNUP_ERROR_KEY;
};

export default getRegistrationError;
