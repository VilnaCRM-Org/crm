import i18n, { i18n as I18nType } from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslations from '@/i18n/localization.json';

export const testI18n: I18nType = i18n.createInstance();

testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: { translation: enTranslations.en.translation },
  },
  interpolation: { escapeValue: false },
  initImmediate: false,
});

export default testI18n;
