import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import ROUTE_PATHS from '@/routes/route-paths';
import AuthCard from '@auth/components/auth-card';
import CardBackControl from '@auth/components/reset-password/card-back-control';
import RecoveryResultView from '@auth/components/reset-password/recovery-result-view';
import ResetPasswordForm from '@auth/components/reset-password/reset-password-form';
import useAuthProviderLoader from '@auth/hooks/use-auth-provider-loader';
import useResetPassword from '@auth/hooks/use-reset-password';
import type {
  RecoveryResultViewProps,
  RecoverySentStepProps,
} from '@auth/types/password-recovery/components';

function useSentResult(maskedEmail: string | null): RecoveryResultViewProps {
  const { t } = useTranslation();
  return {
    title: t('password_recovery.sent.title'),
    body: t('password_recovery.sent.body', { email: maskedEmail }),
    action: { label: t('password_recovery.sent.to_sign_in'), to: ROUTE_PATHS.signIn },
  };
}

function SentStep({ maskedEmail, onBack }: RecoverySentStepProps): JSX.Element {
  const sent = useSentResult(maskedEmail);
  return (
    <>
      <CardBackControl onClick={onBack} />
      <RecoveryResultView title={sent.title} body={sent.body} action={sent.action} />
    </>
  );
}

export default function ResetPasswordFormSection(): JSX.Element {
  const { callbacks, ...state } = useResetPassword(useAuthProviderLoader());

  return (
    <AuthCard variant="recovery">
      {state.step === 'sent' ? (
        <SentStep maskedEmail={state.maskedEmail} onBack={callbacks.backToForm} />
      ) : (
        <>
          <CardBackControl to={ROUTE_PATHS.signIn} />
          <ResetPasswordForm
            defaultValues={{ email: state.submittedEmail }}
            onSubmit={callbacks.submit}
            onDismissFailure={callbacks.dismissFailure}
            failure={state.failure}
            isSubmitting={state.isSubmitting}
            focusTitle={state.returned}
          />
        </>
      )}
    </AuthCard>
  );
}
