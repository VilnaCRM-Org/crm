import type { i18n as I18nType } from 'i18next';

import lazyCatalogLoader from '@/lib/locale-catalog/lazy-catalog-loader';
import noticeEn from '@auth/components/recovery-codes-notice/i18n/en.json';
import noticeUk from '@auth/components/recovery-codes-notice/i18n/uk.json';

import createLocaleI18n from './create-locale-i18n';

const createCodesNoticeLocaleI18n = (...args: Parameters<typeof createLocaleI18n>): I18nType => {
  const instance = createLocaleI18n(...args);
  lazyCatalogLoader.register(instance, { en: noticeEn, uk: noticeUk });

  return instance;
};

export default createCodesNoticeLocaleI18n;
