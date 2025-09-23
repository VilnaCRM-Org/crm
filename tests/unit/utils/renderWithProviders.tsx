import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, RenderResult } from '@testing-library/react';
import i18n from 'i18next';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';

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

const renderWithProviders = (component: React.ReactElement): RenderResult =>
  render(
    <BrowserRouter>
      <ThemeProvider theme={testTheme}>
        <I18nextProvider i18n={i18n}>{component}</I18nextProvider>
      </ThemeProvider>
    </BrowserRouter>
  );

export default renderWithProviders;
