import i18n, { type i18n as I18nType } from 'i18next';
import { initReactI18next } from 'react-i18next';

import localization from '@/i18n/localization.json';

type Locale = keyof typeof localization;

/**
 * Builds a synchronous i18next instance that starts in one real locale from the merged catalog,
 * so a test asserts the shipped translation rather than a key or a hand-written copy of the
 * string. `alsoLoaded` adds further locales a test can switch to with `changeLanguage`.
 */
const createLocaleI18n = (locale: Locale, alsoLoaded: readonly Locale[] = []): I18nType => {
  const instance = i18n.createInstance();
  const resources = Object.fromEntries(
    [locale, ...alsoLoaded].map((loaded) => [
      loaded,
      { translation: localization[loaded].translation },
    ])
  );
  instance.use(initReactI18next).init({
    lng: locale,
    fallbackLng: locale,
    resources,
    interpolation: { escapeValue: false },
    initAsync: false,
  });

  return instance;
};

export default createLocaleI18n;
