import UIBackToMain from '@/components/ui-back-to-main';
import UIFooter from '@/components/ui-footer';
import { lazy, Suspense } from 'react';

import AuthErrorBoundary from '@/modules/user/features/auth/components/auth-error-boundary';
import AuthSkeleton from '@/modules/user/features/auth/components/auth-skeleton';

const FormSection = lazy(async () => import('@/modules/user/features/auth/components/form-section'));

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
