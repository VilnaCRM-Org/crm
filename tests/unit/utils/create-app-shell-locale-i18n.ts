import type { i18n as I18nType } from 'i18next';

import appShellEn from '@/components/ui-app-shell/i18n/en.json';
import appShellUk from '@/components/ui-app-shell/i18n/uk.json';
import userMenuEn from '@/modules/user/features/settings/components/user-menu/i18n/en.json';
import userMenuUk from '@/modules/user/features/settings/components/user-menu/i18n/uk.json';

import addTestCatalog from './add-test-catalog';
import createLocaleI18n from './create-locale-i18n';

const createAppShellLocaleI18n = (...args: Parameters<typeof createLocaleI18n>): I18nType => {
  const instance = createLocaleI18n(...args);
  addTestCatalog(instance, { en: appShellEn, uk: appShellUk });
  addTestCatalog(instance, { en: userMenuEn, uk: userMenuUk });

  return instance;
};

export default createAppShellLocaleI18n;
