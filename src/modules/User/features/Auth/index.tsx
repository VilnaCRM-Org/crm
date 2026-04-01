import UIFooter from '@/components/UIFooter';
import BackToMain from '@/modules/BackToMain';

import FormSection from '@/modules/User/features/Auth/components/FormSection';
import AuthErrorBoundary from './components/AuthErrorBoundary';

export default function Authentication(): JSX.Element {
  return (
    <>
      <BackToMain />
      <main>
        <AuthErrorBoundary>
          <FormSection />
        </AuthErrorBoundary>
      </main>

      <UIFooter />
    </>
  );
}
