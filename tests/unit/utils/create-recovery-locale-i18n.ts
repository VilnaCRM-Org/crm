import type { i18n as I18nType } from 'i18next';

import policyEn from '@/components/ui-password-policy-rules/i18n/en.json';
import policyUk from '@/components/ui-password-policy-rules/i18n/uk.json';
import lazyCatalogLoader from '@/lib/locale-catalog/lazy-catalog-loader';
import recoveryEn from '@auth/routes/recovery-catalog/i18n/en.json';
import recoveryUk from '@auth/routes/recovery-catalog/i18n/uk.json';

import createLocaleI18n from './create-locale-i18n';

const createRecoveryLocaleI18n = (...args: Parameters<typeof createLocaleI18n>): I18nType => {
  const instance = createLocaleI18n(...args);
  lazyCatalogLoader.register(instance, { en: recoveryEn, uk: recoveryUk });
  lazyCatalogLoader.register(instance, { en: policyEn, uk: policyUk });

  return instance;
};

export default createRecoveryLocaleI18n;
