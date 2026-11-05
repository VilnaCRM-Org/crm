import type { i18n as I18nInstance } from 'i18next';

import type { LocaleCatalogPair } from './types/locale-catalog-pair';

class LazyCatalogLoader {
  public register(i18n: I18nInstance, catalog: LocaleCatalogPair): void {
    i18n.addResourceBundle('en', 'translation', catalog.en, true);
    i18n.addResourceBundle('uk', 'translation', catalog.uk, true);
  }
}

export default new LazyCatalogLoader();
