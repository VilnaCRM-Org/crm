import type { i18n as I18nType } from 'i18next';

import policyEn from '@/components/ui-password-policy-rules/i18n/en.json';
import policyUk from '@/components/ui-password-policy-rules/i18n/uk.json';
import lazyCatalogLoader from '@/lib/locale-catalog/lazy-catalog-loader';
import settingsEn from '@/modules/user/features/settings/i18n/en.json';
import settingsUk from '@/modules/user/features/settings/i18n/uk.json';

import createLocaleI18n from './create-locale-i18n';
import createToastLocaleI18n from './create-toast-locale-i18n';

const createSettingsLocaleI18n = (...args: Parameters<typeof createLocaleI18n>): I18nType => {
  const instance = createToastLocaleI18n(...args);
  lazyCatalogLoader.register(instance, { en: settingsEn, uk: settingsUk });
  lazyCatalogLoader.register(instance, { en: policyEn, uk: policyUk });

  return instance;
};

export default createSettingsLocaleI18n;
