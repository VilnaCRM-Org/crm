import { Box } from '@mui/material';
import { lazy, Suspense } from 'react';

import AuthSkeleton from '@/components/skeletons/auth-skeleton';
import UIBackToMain from '@/components/ui-back-to-main';
import UIFooter from '@/components/ui-footer';
import AuthErrorBoundary from '@auth/components/auth-error-boundary';

const FormSection = lazy(() => import('@auth/components/form-section'));

export default function Authentication(): JSX.Element {
  return (
    <>
      <UIBackToMain />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AuthErrorBoundary>
          <Suspense fallback={<AuthSkeleton />}>
            <FormSection />
          </Suspense>
        </AuthErrorBoundary>
      </Box>

      <UIFooter />
    </>
  );
}
