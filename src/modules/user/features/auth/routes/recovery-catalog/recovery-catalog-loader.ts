import type { i18n as I18nInstance } from 'i18next';

import en from './i18n/en.json';
import uk from './i18n/uk.json';

class RecoveryCatalogLoader {
  public register(i18n: I18nInstance): void {
    i18n.addResourceBundle('en', 'translation', en, true);
    i18n.addResourceBundle('uk', 'translation', uk, true);
  }
}

export default new RecoveryCatalogLoader();
