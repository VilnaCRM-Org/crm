import type { JSX } from 'react';

import ROUTE_PATHS from '@/routes/route-paths';
import AuthCard from '@auth/components/auth-card';
import CardBackControl from '@auth/components/reset-password/card-back-control';
import ResetPasswordForm from '@auth/components/reset-password/reset-password-form';
import ResetPasswordSentStep from '@auth/components/reset-password/reset-password-sent-step';
import useAuthProviderLoader from '@auth/hooks/use-auth-provider-loader';
import useResetPassword from '@auth/hooks/use-reset-password';

export default function ResetPasswordFormSection(): JSX.Element {
  const state = useResetPassword(useAuthProviderLoader());

  if (state.step === 'sent') {
    return (
      <ResetPasswordSentStep maskedEmail={state.maskedEmail} onBack={state.callbacks.backToForm} />
    );
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
        focusTitle={state.returned}
      />
    </AuthCard>
  );
}
