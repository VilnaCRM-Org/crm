import { ThemeProvider, createTheme, Theme } from '@mui/material/styles';
import { render, RenderResult } from '@testing-library/react';
import i18n, { i18n as I18nType } from 'i18next';
import React from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import enTranslations from '@/i18n/localization.json';

export const testI18n = i18n.createInstance();

testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: { translation: enTranslations.en.translation },
  },
  interpolation: { escapeValue: false },
  initImmediate: false, // synchronous init
});

export const testTheme = createTheme({
  spacing: 8,
  palette: {
    background: {
      default: '#ffffff',
    },
    grey: {
      50: '#333333',
    },
  },
  typography: {
    fontFamily: 'Golos, sans-serif',
  },
});

interface RenderOptions {
  theme?: Theme;
  i18nMock?: I18nType;
}
const renderWithProviders = (
  component: React.ReactElement,
  { theme = testTheme, i18nMock = testI18n }: RenderOptions = {}
): RenderResult =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <I18nextProvider i18n={i18nMock}>{component}</I18nextProvider>
      </ThemeProvider>
    </MemoryRouter>
  );

export default renderWithProviders;
