import type { i18n as I18nType } from 'i18next';

import recoveryCatalogLoader from '@auth/routes/recovery-catalog/recovery-catalog-loader';

import createLocaleI18n from './create-locale-i18n';

/**
 * `createLocaleI18n` plus the password-recovery catalog, which only the recovery route modules
 * register at runtime. Use it for tests of those routes and the components they own; a test of an
 * eager page keeps `createLocaleI18n`, so a recovery key leaking into that page renders raw there.
 */
const createRecoveryLocaleI18n = (...args: Parameters<typeof createLocaleI18n>): I18nType => {
  const instance = createLocaleI18n(...args);
  recoveryCatalogLoader.register(instance);

  return instance;
};

export default createRecoveryLocaleI18n;
