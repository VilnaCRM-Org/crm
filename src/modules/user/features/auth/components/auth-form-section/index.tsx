import type { JSX } from 'react';

import AuthCard from '@auth/components/auth-card';
import AuthProviderButtons from '@auth/components/form-section/components/auth-provider-buttons';
import InertBox from '@auth/components/form-section/inert-box';
import type { AuthFormSectionProps } from '@auth/types/auth-form-section';

export default function AuthFormSection({
  children,
  oauthInert,
  page,
  switcher,
}: AuthFormSectionProps): JSX.Element {
  return (
    <AuthCard page={page} after={switcher}>
      {children}
      <InertBox id="auth-provider-buttons-container" inert={oauthInert}>
        <AuthProviderButtons />
      </InertBox>
    </AuthCard>
  );
}
