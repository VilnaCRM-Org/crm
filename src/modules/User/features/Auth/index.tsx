import UIFooter from '@/components/UIFooter';
import BackToMain from '@/modules/BackToMain';
import Theme from '@/styles/theme';
import { ThemeProvider } from '@mui/material/styles';
import React from 'react';


export default function Authentication(): React.ReactElement {
  return (
    <ThemeProvider theme={Theme}>
      <main>
      <BackToMain />

      <UIFooter />
      </main>
    </ThemeProvider>
  );
}
