import UIBackToMain from '@/components/ui-back-to-main';
import UIFooter from '@/components/ui-footer';
import Theme from '@/styles/theme';
import { ThemeProvider } from '@mui/material/styles';

import FormSection from '@/modules/user/features/auth/components/form-section';

import AuthErrorBoundary from './components/auth-error-boundary';

export default function Authentication(): JSX.Element {
  return (
    <ThemeProvider theme={Theme}>
      <UIBackToMain />
      <main>
        <AuthErrorBoundary>
          <FormSection />
        </AuthErrorBoundary>
      </main>

      <UIFooter />
    </ThemeProvider>
  );
}
