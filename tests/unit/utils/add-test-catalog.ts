import type { i18n as I18nType } from 'i18next';

import type { LocaleCatalogPair } from '@/lib/locale-catalog/types/locale-catalog-pair';

const addTestCatalog = (instance: I18nType, catalog: LocaleCatalogPair): void => {
  instance.addResourceBundle('en', 'translation', catalog.en, true);
  instance.addResourceBundle('uk', 'translation', catalog.uk, true);
};

export default addTestCatalog;
