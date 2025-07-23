const i18n = require('i18next');
const { initReactI18next } = require('react-i18next');

const i18nConfig = require('./src/config/i18nConfig');

i18n.use(initReactI18next).init(i18nConfig);

module.exports = i18n;
