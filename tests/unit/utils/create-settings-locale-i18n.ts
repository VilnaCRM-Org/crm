import type { i18n as I18nType } from 'i18next';

import policyLoader from '@/components/ui-password-policy-rules/password-policy-catalog-loader';
import settings from '@/modules/user/features/settings/routes/user-profile/settings-catalog-loader';

import createLocaleI18n from './create-locale-i18n';

const createSettingsLocaleI18n = (...args: Parameters<typeof createLocaleI18n>): I18nType => {
  const instance = createLocaleI18n(...args);
  settings.register(instance);
  policyLoader.register(instance);

  return instance;
};

export default createSettingsLocaleI18n;
