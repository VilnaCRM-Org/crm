import type { i18n as I18nType } from 'i18next';

import appShellEn from '@/components/ui-app-shell/i18n/en.json';
import appShellUk from '@/components/ui-app-shell/i18n/uk.json';
import lazyCatalogLoader from '@/lib/locale-catalog/lazy-catalog-loader';
import userMenuEn from '@/modules/user/features/settings/components/user-menu/i18n/en.json';
import userMenuUk from '@/modules/user/features/settings/components/user-menu/i18n/uk.json';

import createLocaleI18n from './create-locale-i18n';

const createAppShellLocaleI18n = (...args: Parameters<typeof createLocaleI18n>): I18nType => {
  const instance = createLocaleI18n(...args);
  lazyCatalogLoader.register(instance, { en: appShellEn, uk: appShellUk });
  lazyCatalogLoader.register(instance, { en: userMenuEn, uk: userMenuUk });

  return instance;
};

export default createAppShellLocaleI18n;
