import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import ROUTE_PATHS from '@/routes/route-paths';
import AuthCard from '@auth/components/auth-card';
import CreateNewPasswordForm from '@auth/components/create-new-password/create-new-password-form';
import CardBackControl from '@auth/components/reset-password/card-back-control';
import RecoveryResultView from '@auth/components/reset-password/recovery-result-view';
import useAuthProviderLoader from '@auth/hooks/use-auth-provider-loader';
import useCreateNewPassword from '@auth/hooks/use-create-new-password';
import useResetToken from '@auth/hooks/use-reset-token';

export default function CreateNewPasswordFormSection(): JSX.Element {
  const { t } = useTranslation();
  const state = useCreateNewPassword(useAuthProviderLoader());
  const token = useResetToken(state.view !== 'invalid');

  return (
    <AuthCard variant="recovery">
      {token === null || state.view === 'invalid' ? (
        <>
          <CardBackControl to={ROUTE_PATHS.signIn} />
          <RecoveryResultView
            title={t('password_reset.invalid.title')}
            body={t('password_reset.invalid.body')}
            action={{
              label: t('password_reset.invalid.request_new'),
              to: ROUTE_PATHS.passwordRecovery,
            }}
          />
        </>
      ) : (
        <CreateNewPasswordForm
          token={token}
          onSubmit={state.callbacks.submit}
          onDismissFailure={state.callbacks.dismissFailure}
          failure={state.failure}
          isSubmitting={state.isSubmitting}
        />
      )}
    </AuthCard>
  );
}
