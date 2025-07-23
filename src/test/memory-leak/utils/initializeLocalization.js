const i18n = require('i18next');
const { initReactI18next } = require('react-i18next');

const i18nConfig = require('../../../config/i18nConfig');

async function initializeLocalization() {
  await i18n.use(initReactI18next).init(i18nConfig);
  return i18n;
}

module.exports = { initializeLocalization, i18n };
