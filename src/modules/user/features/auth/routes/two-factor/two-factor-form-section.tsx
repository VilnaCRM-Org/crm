import type { JSX } from 'react';

import AuthCard from '@auth/components/auth-card';
import CardBackControl from '@auth/components/reset-password/card-back-control';
import TwoFactorChallengeForm from '@auth/components/two-factor/two-factor-challenge-form';
import useAuthProviderLoader from '@auth/hooks/use-auth-provider-loader';
import useChallengeBack from '@auth/hooks/use-challenge-back';
import useTwoFactorChallenge from '@auth/hooks/use-two-factor-challenge';

export default function TwoFactorFormSection(): JSX.Element {
  const challenge = useTwoFactorChallenge(useAuthProviderLoader());
  const back = useChallengeBack();

  return (
    <AuthCard>
      <CardBackControl onClick={back} />
      <TwoFactorChallengeForm state={challenge.state} callbacks={challenge.callbacks} />
    </AuthCard>
  );
}
