import { useTranslation } from 'react-i18next';

const GENERIC_REGISTRATION_VALIDATION_ERRORS = new Set([
  'invalid data provided',
  'invalid registration data',
  'unprocessable registration data',
]);

function normalize(errorText: string | undefined): string | undefined {
  return errorText?.trim().toLowerCase().replace(/\s+/g, ' ');
}

export default function useResolvedErrorText(errorText: string | undefined): string {
  const { t } = useTranslation();
  const normalized = normalize(errorText);
  if (!normalized) return t('failure_responses.client_errors.something_went_wrong');
  if (GENERIC_REGISTRATION_VALIDATION_ERRORS.has(normalized)) {
    return t('sign_up.errors.signup_error');
  }
  return errorText as string;
}
