import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import localization from './i18n/localization.json';

const MAIN_LANGUAGE = process.env.REACT_APP_MAIN_LANGUAGE || 'uk';
const FALLBACK_LANGUAGE = process.env.REACT_APP_FALLBACK_LANGUAGE || 'en';

i18n.use(initReactI18next).init({
  resources: localization,
  lng: MAIN_LANGUAGE,
  fallbackLng: FALLBACK_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
