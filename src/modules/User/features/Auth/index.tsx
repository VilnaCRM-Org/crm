import UIFooter from '@/components/UIFooter';
import BackToMain from '@/modules/BackToMain';
import { lazy, Suspense } from 'react';

import AuthErrorBoundary from './components/AuthErrorBoundary';

const FormSection = lazy(async () => import('@/modules/User/features/Auth/components/FormSection'));

export default function Authentication(): JSX.Element {
  return (
    <>
      <BackToMain />
      <main>
        <AuthErrorBoundary>
          <Suspense fallback={null}>
            <FormSection />
          </Suspense>
        </AuthErrorBoundary>
      </main>

      <UIFooter />
    </>
  );
}
