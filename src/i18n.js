const i18n = require('i18next');
const { initReactI18next } = require('react-i18next');

const localization = require('./i18n/localization.json');
const { default: rawEnv } = require('./config/env/raw-env');
const { default: localeFormatter } = require('./services/locale-formatter/locale-formatter-core');

const MAIN_LANGUAGE = rawEnv.mainLanguage();
const FALLBACK_LANGUAGE = (process.env.REACT_APP_FALLBACK_LANGUAGE || '').trim() || 'en';

i18n.use(initReactI18next).init({
  resources: localization,
  lng: MAIN_LANGUAGE,
  fallbackLng: FALLBACK_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
});

localeFormatter.bindLanguageSource(i18n);

i18n.services.formatter.add('date', (value, lng) => localeFormatter.date(value, lng));
i18n.services.formatter.add('datetime', (value, lng) => localeFormatter.dateTime(value, lng));
i18n.services.formatter.add('number', (value, lng) => localeFormatter.number(value, lng));
i18n.services.formatter.add('currency', (value, lng, options) =>
  localeFormatter.currency(value, options.currency, lng)
);
i18n.services.formatter.add('percent', (value, lng) => localeFormatter.percent(value, lng));
i18n.services.formatter.add('relativetime', (value, lng, options) =>
  localeFormatter.relativeTime(value, options.range || 'day', lng)
);

export default i18n;
