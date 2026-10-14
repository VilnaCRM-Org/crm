import type { i18n as I18nType } from 'i18next';

import recoveryCatalogLoader from '@auth/routes/recovery-catalog/recovery-catalog-loader';

import createLocaleI18n from './create-locale-i18n';

const createRecoveryLocaleI18n = (...args: Parameters<typeof createLocaleI18n>): I18nType => {
  const instance = createLocaleI18n(...args);
  recoveryCatalogLoader.register(instance);

  return instance;
};

export default createRecoveryLocaleI18n;
