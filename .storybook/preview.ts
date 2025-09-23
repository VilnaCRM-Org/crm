import type { Preview } from '@storybook/react';
import resources from '../src/i18n/localization.json';
import { initReactI18next } from 'react-i18next';
import i18next from 'i18next';

const mainLanguage = process.env.REACT_APP_MAIN_LANGUAGE || 'uk';
const fallbackLanguage = process.env.REACT_APP_FALLBACK_LANGUAGE || 'en';

i18next.use(initReactI18next).init({
  resources,
  lng: mainLanguage,
  fallbackLng: fallbackLanguage,
  interpolation: { escapeValue: false },
});

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
