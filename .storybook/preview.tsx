import type { Preview } from '@storybook/react';
import { INITIAL_VIEWPORTS } from 'storybook/viewport';
import resources from '../src/i18n/localization.json';
import { initReactI18next } from 'react-i18next';
import i18next from 'i18next';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '../src/styles/theme';

const mainLanguage = process.env.REACT_APP_MAIN_LANGUAGE || 'uk';
const fallbackLanguage = process.env.REACT_APP_FALLBACK_LANGUAGE || 'en';

export const i18nInitPromise = i18next.isInitialized
  ? Promise.resolve()
  : i18next
      .use(initReactI18next)
      .init({
        resources,
        lng: mainLanguage,
        fallbackLng: fallbackLanguage,
        interpolation: { escapeValue: false },
      })
      .catch((error) => {
        console.error('Failed to initialize Storybook i18n', error);
        throw error;
      });

const customViewports: typeof INITIAL_VIEWPORTS = {
  xs: {
    name: 'XS (320)',
    styles: { width: '320px', height: '568px' },
    type: 'mobile',
  },
  sm: {
    name: 'SM (480)',
    styles: { width: '480px', height: '800px' },
    type: 'mobile',
  },
  md: {
    name: 'MD (768)',
    styles: { width: '768px', height: '1024px' },
    type: 'tablet',
  },
  lg: {
    name: 'LG (1024)',
    styles: { width: '1024px', height: '768px' },
    type: 'desktop',
  },
  xl: {
    name: 'XL (1440)',
    styles: { width: '1440px', height: '900px' },
    type: 'desktop',
  },
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      options: customViewports,
    },
  },
  initialGlobals: {
    viewport: { value: 'lg', isRotated: false },
  },
  loaders: [
    async () => {
      await i18nInitPromise;
      return {};
    },
  ],
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Story />
      </ThemeProvider>
    ),
  ],
};

export default preview;
