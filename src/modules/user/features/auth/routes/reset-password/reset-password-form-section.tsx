import { type JSX, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ROUTE_PATHS from '@/routes/route-paths';
import AuthCard from '@auth/components/auth-card';
import CardBackControl from '@auth/components/reset-password/card-back-control';
import RecoveryResultView from '@auth/components/reset-password/recovery-result-view';
import ResetPasswordForm from '@auth/components/reset-password/reset-password-form';
import useAuthProviderLoader from '@auth/hooks/use-auth-provider-loader';
import useResetPassword from '@auth/hooks/use-reset-password';
import type { ResetPasswordSentStepProps } from '@auth/types/password-recovery/components';

function SentStep({ maskedEmail, onBack }: ResetPasswordSentStepProps): JSX.Element {
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

export default function ResetPasswordFormSection(): JSX.Element {
  const state = useResetPassword(useAuthProviderLoader());
  const [reentered, setReentered] = useState(false);
  const { backToForm: showForm } = state.callbacks;
  const backToForm = useCallback((): void => {
    setReentered(true);
    showForm();
  }, [showForm]);

  if (state.step === 'sent') {
    return <SentStep maskedEmail={state.maskedEmail} onBack={backToForm} />;
  }
  return (
    <AuthCard>
      <CardBackControl to={ROUTE_PATHS.signIn} />
      <ResetPasswordForm
        defaultValues={{ email: state.submittedEmail }}
        onSubmit={state.callbacks.submit}
        onRetry={state.callbacks.retry}
        failure={state.failure}
        isSubmitting={state.isSubmitting}
        focusTitle={reentered}
      />
    </AuthCard>
  );
}
