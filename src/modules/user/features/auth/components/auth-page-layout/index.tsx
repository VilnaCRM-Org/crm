import { Box } from '@mui/material';
import { Suspense } from 'react';

import AuthSkeleton from '@/components/skeletons/auth-skeleton';
import UIBackToMain from '@/components/ui-back-to-main';
import UIFooter from '@/components/ui-footer';
import AuthErrorBoundary from '@auth/components/auth-error-boundary';
import type { AuthPageLayoutProps } from '@auth/types/auth-page-layout';

export default function AuthPageLayout({ children }: AuthPageLayoutProps): JSX.Element {
  return (
    <>
      <UIBackToMain />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AuthErrorBoundary>
          <Suspense fallback={<AuthSkeleton />}>{children}</Suspense>
        </AuthErrorBoundary>
      </Box>

      <UIFooter />
    </>
  );
}
