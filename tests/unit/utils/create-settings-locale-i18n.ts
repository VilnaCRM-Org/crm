import type { i18n as I18nType } from 'i18next';

import policyEn from '@/components/ui-password-policy-rules/i18n/en.json';
import policyUk from '@/components/ui-password-policy-rules/i18n/uk.json';
import settingsEn from '@/modules/user/features/settings/i18n/en.json';
import settingsUk from '@/modules/user/features/settings/i18n/uk.json';

import addTestCatalog from './add-test-catalog';
import createLocaleI18n from './create-locale-i18n';
import createContentI18n from './create-notification-content-locale-i18n';

const createSettingsLocaleI18n = (...args: Parameters<typeof createLocaleI18n>): I18nType => {
  const instance = createContentI18n(...args);
  addTestCatalog(instance, { en: settingsEn, uk: settingsUk });
  addTestCatalog(instance, { en: policyEn, uk: policyUk });

  return instance;
};

export default createSettingsLocaleI18n;
