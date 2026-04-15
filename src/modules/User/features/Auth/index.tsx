
import { lazy, Suspense } from 'react';

import UIFooter from '@/components/UIFooter';
import BackToMain from '@/modules/BackToMain';
import AuthErrorBoundary from '@/modules/User/features/Auth/components/auth-error-boundary';
import AuthSkeleton from '@/modules/User/features/Auth/components/auth-skeleton';

const FormSection = lazy(() => import('@/modules/User/features/Auth/components/form-section'));

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
