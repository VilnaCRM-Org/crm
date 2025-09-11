const i18n = require('i18next');
const { initReactI18next } = require('react-i18next');

const i18nConfig = require('./i18n/localization.json');

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
