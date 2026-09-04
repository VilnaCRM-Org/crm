import { useTranslation } from 'react-i18next';

import registrationErrorMapper from '@auth/utils/map-registration-error';

const BLANK_ERROR_KEY = 'failure_responses.client_errors.something_went_wrong';

export default function useResolvedErrorText(errorText: string | undefined): string {
  const { t } = useTranslation();
  return t(registrationErrorMapper.map(errorText?.trim()) ?? BLANK_ERROR_KEY);
}
