import type { i18n as I18nType } from 'i18next';

import appShellEn from '@/components/ui-app-shell/i18n/en.json';
import appShellUk from '@/components/ui-app-shell/i18n/uk.json';

import addTestCatalog from './add-test-catalog';
import createNotificationCenterLocaleI18n from './create-notification-center-locale-i18n';

const createBellLocaleI18n = (
  ...args: Parameters<typeof createNotificationCenterLocaleI18n>
): I18nType => {
  const instance = createNotificationCenterLocaleI18n(...args);
  addTestCatalog(instance, { en: appShellEn, uk: appShellUk });

  return instance;
};

export default createBellLocaleI18n;
