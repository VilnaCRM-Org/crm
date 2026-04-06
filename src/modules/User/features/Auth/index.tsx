
import UIFooter from '@/components/UIFooter';
import BackToMain from '@/modules/BackToMain';
import { lazy, Suspense } from 'react';

import AuthSkeleton from '@/modules/User/features/Auth/components/auth-skeleton';
import AuthErrorBoundary from '@/modules/User/features/Auth/components/AuthErrorBoundary';

const FormSection = lazy(() => import('@/modules/User/features/Auth/components/FormSection'));

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
