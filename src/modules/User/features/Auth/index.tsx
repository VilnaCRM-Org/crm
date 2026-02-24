import AuthSkeleton from '@/components/Skeletons/AuthSkeleton';
import UIFooter from '@/components/UIFooter';
import BackToMain from '@/modules/BackToMain';
import Theme from '@/styles/theme';
import { ThemeProvider } from '@mui/material/styles';
import { lazy, Suspense } from 'react';

import AuthErrorBoundary from '@/modules/User/features/Auth/components/AuthErrorBoundary';

const FormSection = lazy(() => import('@/modules/User/features/Auth/components/FormSection'));

export default function Authentication(): JSX.Element {
  return (
    <ThemeProvider theme={Theme}>
      <BackToMain />
      <main>
        <AuthErrorBoundary>
          <Suspense fallback={<AuthSkeleton />}>
            <FormSection />
          </Suspense>
        </AuthErrorBoundary>
      </main>

      <UIFooter />
    </ThemeProvider>
  );
}
