import type { i18n as I18nType } from 'i18next';

import toastEn from '@/components/ui-toast/i18n/en.json';
import toastUk from '@/components/ui-toast/i18n/uk.json';
import lazyCatalogLoader from '@/lib/locale-catalog/lazy-catalog-loader';

import createLocaleI18n from './create-locale-i18n';

const createToastLocaleI18n = (...args: Parameters<typeof createLocaleI18n>): I18nType => {
  const instance = createLocaleI18n(...args);
  lazyCatalogLoader.register(instance, { en: toastEn, uk: toastUk });

  return instance;
};

export default createToastLocaleI18n;
