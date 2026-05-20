import { lazy, Suspense } from 'react';

import UIFooter from '@/components/UIFooter';
import BackToMain from '@/modules/BackToMain';

import AuthErrorBoundary from './components/auth-error-boundary';
import AuthSkeleton from './components/auth-skeleton';

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
