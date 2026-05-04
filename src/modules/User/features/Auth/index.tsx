import UIBackToMain from '@/components/ui-back-to-main';
import UIFooter from '@/components/ui-footer';
import { Box } from '@mui/material';
import { lazy, Suspense } from 'react';

import AuthErrorBoundary from '@/modules/User/features/Auth/components/auth-error-boundary';
import AuthSkeleton from '@/modules/User/features/Auth/components/auth-skeleton';


const FormSection = lazy(
  async () => import('@/modules/User/features/Auth/components/form-section')
);

export default function Authentication(): JSX.Element {
  return (
    <>
      <UIBackToMain />
      <Box
        component="main"
        sx={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}
      >
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
