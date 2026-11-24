import type { i18n as I18nType } from 'i18next';

import lazyCatalogLoader from '@/lib/locale-catalog/lazy-catalog-loader';
import en from '@/modules/user/features/notifications/i18n/en.json';
import uk from '@/modules/user/features/notifications/i18n/uk.json';
import settingsEn from '@/modules/user/features/settings/i18n/en.json';
import settingsUk from '@/modules/user/features/settings/i18n/uk.json';

import createLocaleI18n from './create-locale-i18n';

const createNotificationCenterLocaleI18n = (
  ...args: Parameters<typeof createLocaleI18n>
): I18nType => {
  const instance = createLocaleI18n(...args);
  lazyCatalogLoader.register(instance, { en, uk });
  lazyCatalogLoader.register(instance, { en: settingsEn, uk: settingsUk });

  return instance;
};

export default createNotificationCenterLocaleI18n;
