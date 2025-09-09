import i18n from '@/i18n';

export const EMAIL_ALREADY_USED = i18n.t('sign_up.errors.email_used');
export const GENERIC_SIGNUP_ERROR = i18n.t('sign_up.errors.signup_error');

const ERROR_PATTERNS: { keys: string[]; message: string }[] = [
  { keys: ['email', 'exists'], message: EMAIL_ALREADY_USED },
];

export const getRegistrationError = (rawError: string | null | undefined): string | null => {
  if (!rawError) return null;

  const matchedPattern = ERROR_PATTERNS.find(({ keys }) =>
    keys.some((key) => rawError.includes(key))
  );

  return matchedPattern ? matchedPattern.message : GENERIC_SIGNUP_ERROR;
};

export default getRegistrationError;
