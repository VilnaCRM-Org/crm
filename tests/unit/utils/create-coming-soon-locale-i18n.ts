import type { i18n as I18nType } from 'i18next';

import comingSoonEn from '@/components/coming-soon/i18n/en.json';
import comingSoonUk from '@/components/coming-soon/i18n/uk.json';
import lazyCatalogLoader from '@/lib/locale-catalog/lazy-catalog-loader';

import createLocaleI18n from './create-locale-i18n';

const createComingSoonLocaleI18n = (...args: Parameters<typeof createLocaleI18n>): I18nType => {
  const instance = createLocaleI18n(...args);
  lazyCatalogLoader.register(instance, { en: comingSoonEn, uk: comingSoonUk });

  return instance;
};

export default createComingSoonLocaleI18n;
