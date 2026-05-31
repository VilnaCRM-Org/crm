import { lazy, Suspense } from 'react';

import AuthSkeleton from '@/components/skeletons/auth-skeleton';
import BackToMain from '@/components/ui-back-to-main';
import UIFooter from '@/components/ui-footer';
import AuthErrorBoundary from '@auth/components/auth-error-boundary';

const FormSection = lazy(() => import('@auth/components/form-section'));

export default function Authentication(): JSX.Element {
  return (
    <>
      <BackToMain />
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
