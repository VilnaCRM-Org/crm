import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import rawEnv from './config/env/raw-env';
import localization from './i18n/localization.json';
import localeFormatter from './services/locale-formatter/locale-formatter-core';

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
