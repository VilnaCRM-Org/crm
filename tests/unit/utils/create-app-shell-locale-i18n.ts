import type { i18n as I18nType } from 'i18next';

import appShellEn from '@/components/ui-app-shell/i18n/en.json';
import appShellUk from '@/components/ui-app-shell/i18n/uk.json';
import lazyCatalogLoader from '@/lib/locale-catalog/lazy-catalog-loader';

import createLocaleI18n from './create-locale-i18n';

const createAppShellLocaleI18n = (...args: Parameters<typeof createLocaleI18n>): I18nType => {
  const instance = createLocaleI18n(...args);
  lazyCatalogLoader.register(instance, { en: appShellEn, uk: appShellUk });

  return instance;
};

export default createAppShellLocaleI18n;
