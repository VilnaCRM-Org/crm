import UIFooter from '@/components/UIFooter';
import BackToMain from '@/modules/BackToMain';

import AuthErrorBoundary from '@/modules/User/features/Auth/components/AuthErrorBoundary';
import FormSection from '@/modules/User/features/Auth/components/FormSection';

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
