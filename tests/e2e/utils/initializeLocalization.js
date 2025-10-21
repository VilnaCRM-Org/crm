import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import i18nConfig from '../../../src/config/i18nConfig';

i18n.use(initReactI18next).init(i18nConfig);

export const { t } = i18n;

export default i18n.t;
