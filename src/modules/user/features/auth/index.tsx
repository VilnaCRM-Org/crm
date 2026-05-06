
import UIFooter from '@/components/ui-footer';
import BackToMain from '@/components/ui-back-to-main';
import { lazy, Suspense } from 'react';

import AuthErrorBoundary from '@/modules/user/features/auth/components/auth-error-boundary';
import AuthSkeleton from '@/modules/user/features/auth/components/auth-skeleton';

const FormSection = lazy(() => import('@/modules/user/features/auth/components/form-section'));

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
