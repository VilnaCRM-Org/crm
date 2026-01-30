import UIBackToMain from '@/components/UIBackToMain';
import UIFooter from '@/components/UIFooter';
import Theme from '@/styles/theme';
import { ThemeProvider } from '@mui/material/styles';

import FormSection from '@/modules/User/features/Auth/components/FormSection';

import AuthErrorBoundary from './components/AuthErrorBoundary';

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
