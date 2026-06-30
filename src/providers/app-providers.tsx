import CssBaseline from '@mui/material/CssBaseline';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import type { i18n as I18nType } from 'i18next';
import React from 'react';
import { I18nextProvider } from 'react-i18next';

import type { AppProvidersProps } from '@/components/types/providers';
import theme from '@/styles/theme';

import i18nMod from '../i18n';

const i18nInstance = i18nMod as unknown as I18nType;

export default function AppProviders({ children }: AppProvidersProps): JSX.Element {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <I18nextProvider i18n={i18nInstance}>
          <React.Suspense fallback={null}>{children}</React.Suspense>
        </I18nextProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
