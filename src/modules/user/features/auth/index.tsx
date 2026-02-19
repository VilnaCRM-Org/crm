import UIBackToMain from '@/components/ui-back-to-main';
import UIFooter from '@/components/ui-footer';
import Theme from '@/styles/theme';
import { Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';

import FormSection from '@/modules/user/features/auth/components/form-section';

import AuthErrorBoundary from './components/auth-error-boundary';

export default function Authentication(): JSX.Element {
  return (
    <ThemeProvider theme={Theme}>
      <UIBackToMain />
      <Box component="main" sx={{ flex: 1}}>
        <AuthErrorBoundary>
          <FormSection />
        </AuthErrorBoundary>
      </Box>
      <UIFooter />
    </ThemeProvider>
  );
}
