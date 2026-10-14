import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import ROUTE_PATHS from '@/routes/route-paths';
import AuthCard from '@auth/components/auth-card';
import type { ResetPasswordSentStepProps } from '@auth/types/password-recovery/components';

import CardBackControl from './card-back-control';
import RecoveryResultView from './recovery-result-view';

export default function ResetPasswordSentStep({
  maskedEmail,
  onBack,
}: ResetPasswordSentStepProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <AuthCard>
      <CardBackControl onClick={onBack} />
      <RecoveryResultView
        title={t('password_recovery.sent.title')}
        body={t('password_recovery.sent.body', { email: maskedEmail })}
        action={{ label: t('password_recovery.sent.to_sign_in'), to: ROUTE_PATHS.signIn }}
      />
    </AuthCard>
  );
}
