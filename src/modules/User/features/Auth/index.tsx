import UIFooter from '@/components/UIFooter';
import BackToMain from '@/modules/BackToMain';
import Theme from '@/styles/theme';
import { ThemeProvider } from '@mui/material/styles';
import React from 'react';

import FormSection from '@/modules/User/features/Auth/components/FormSection';

export default function Authentication(): JSX.Element {
  return (
    <ThemeProvider theme={Theme}>
      <main>
        <BackToMain />
        <FormSection />
        <UIFooter />
      </main>
    </ThemeProvider>
  );
}
