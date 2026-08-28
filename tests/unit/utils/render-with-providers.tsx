import { ThemeProvider, createTheme, Theme } from '@mui/material/styles';
import { render, RenderResult } from '@testing-library/react';
import type { i18n as I18nType } from 'i18next';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import testI18n from '@tests/i18n/test-i18n';

import ROUTER_FUTURE_FLAGS from './router-future-flags';

export { testI18n };

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
    <MemoryRouter future={ROUTER_FUTURE_FLAGS}>
      <ThemeProvider theme={theme}>
        <I18nextProvider i18n={i18nMock}>{component}</I18nextProvider>
      </ThemeProvider>
    </MemoryRouter>
  );

export default renderWithProviders;
