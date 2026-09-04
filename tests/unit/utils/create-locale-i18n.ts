import i18n, { type i18n as I18nType } from 'i18next';
import { initReactI18next } from 'react-i18next';

import localization from '@/i18n/localization.json';

type Locale = keyof typeof localization;

/**
 * Builds a synchronous i18next instance holding one real locale from the merged catalog, so a
 * test asserts the shipped translation rather than a key or a hand-written copy of the string.
 */
const createLocaleI18n = (locale: Locale): I18nType => {
  const instance = i18n.createInstance();
  instance.use(initReactI18next).init({
    lng: locale,
    fallbackLng: locale,
    resources: { [locale]: { translation: localization[locale].translation } },
    interpolation: { escapeValue: false },
    initImmediate: false,
  });

  return instance;
};

export default createLocaleI18n;
