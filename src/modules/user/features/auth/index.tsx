import { Suspense } from 'react';

import AuthSkeleton from '@/components/skeletons/auth-skeleton';
import UIBackToMain from '@/components/ui-back-to-main';
import UIFooter from '@/components/ui-footer';
import AuthErrorBoundary from '@auth/components/auth-error-boundary';
import FormSection from '@auth/components/form-section';

export default function Authentication(): JSX.Element {
  return (
    <>
      <UIBackToMain />
      <main>
        <AuthErrorBoundary>
          <Suspense fallback={<AuthSkeleton />}>
            <FormSection />
          </Suspense>
        </AuthErrorBoundary>
      </main>

      <UIFooter />
    </>
  );
}
