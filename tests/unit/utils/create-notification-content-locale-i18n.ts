import type { i18n as I18nType } from 'i18next';

import contentEn from '@/components/ui-notification-content/i18n/en.json';
import contentUk from '@/components/ui-notification-content/i18n/uk.json';
import lazyCatalogLoader from '@/lib/locale-catalog/lazy-catalog-loader';

import createLocaleI18n from './create-locale-i18n';

const createNotificationContentLocaleI18n = (
  ...args: Parameters<typeof createLocaleI18n>
): I18nType => {
  const instance = createLocaleI18n(...args);
  lazyCatalogLoader.register(instance, { en: contentEn, uk: contentUk });

  return instance;
};

export default createNotificationContentLocaleI18n;
