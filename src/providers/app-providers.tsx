import { StyledEngineProvider } from '@mui/material/styles';
import type { i18n as I18nType } from 'i18next';
import React, { type JSX } from 'react';
import { I18nextProvider } from 'react-i18next';

import RouteFallback from '@/components/route-fallback';
import type { AppProvidersProps } from '@/components/types/providers';

import i18nMod from '../i18n';

const i18nInstance = i18nMod as unknown as I18nType;

export default function AppProviders({ children }: AppProvidersProps): JSX.Element {
  return (
    <StyledEngineProvider injectFirst>
      <I18nextProvider i18n={i18nInstance}>
        <React.Suspense fallback={<RouteFallback />}>{children}</React.Suspense>
      </I18nextProvider>
    </StyledEngineProvider>
  );
}
