import fs from 'fs';
import path from 'path';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import i18nConfig from '../../../src/config/i18n-config';

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(repoRoot, file), 'utf8'));

const registerLazyCatalogs = (instance) => {
  const { lazyCatalogs } = readJson('config/i18n-catalog-policy.json');
  lazyCatalogs.forEach(({ catalog }) => {
    Object.keys(i18nConfig.resources).forEach((locale) => {
      const bundle = readJson(path.join('src', catalog, `${locale}.json`));
      instance.addResourceBundle(locale, 'translation', bundle, true);
    });
  });
};

export const i18nReady = i18n.use(initReactI18next).init(i18nConfig);
registerLazyCatalogs(i18n);

export { i18n };
export const t = i18n.t.bind(i18n);

export default i18nReady;
