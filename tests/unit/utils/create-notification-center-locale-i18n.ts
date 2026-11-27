import type { i18n as I18nType } from 'i18next';

import en from '@/modules/user/features/notifications/i18n/en.json';
import uk from '@/modules/user/features/notifications/i18n/uk.json';
import settingsEn from '@/modules/user/features/settings/i18n/en.json';
import settingsUk from '@/modules/user/features/settings/i18n/uk.json';

import addTestCatalog from './add-test-catalog';
import createContentI18n from './create-notification-content-locale-i18n';

const createNotificationCenterLocaleI18n = (
  ...args: Parameters<typeof createContentI18n>
): I18nType => {
  const instance = createContentI18n(...args);
  addTestCatalog(instance, { en, uk });
  addTestCatalog(instance, { en: settingsEn, uk: settingsUk });

  return instance;
};

export default createNotificationCenterLocaleI18n;
