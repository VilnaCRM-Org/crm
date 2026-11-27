import type { i18n as I18nType } from 'i18next';

import twoFactorEn from '@auth/routes/two-factor-catalog/i18n/en.json';
import twoFactorUk from '@auth/routes/two-factor-catalog/i18n/uk.json';

import addTestCatalog from './add-test-catalog';
import createRecoveryLocaleI18n from './create-recovery-locale-i18n';

const createTwoFactorLocaleI18n = (
  ...args: Parameters<typeof createRecoveryLocaleI18n>
): I18nType => {
  const instance = createRecoveryLocaleI18n(...args);
  addTestCatalog(instance, { en: twoFactorEn, uk: twoFactorUk });

  return instance;
};

export default createTwoFactorLocaleI18n;
