import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import i18nConfig from '../../../src/config/i18n-config';

export const ready = i18n.use(initReactI18next).init(i18nConfig);

export { i18n };

export const t = i18n.t.bind(i18n);

export default t;
