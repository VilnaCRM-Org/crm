const i18n = require('i18next');
const { initReactI18next } = require('react-i18next');

const i18nConfig = require('../../../src/config/i18nConfig');

async function initializeLocalization() {
  try {
    await i18n.use(initReactI18next).init(i18nConfig);
    return i18n;
  } catch (error) {
    throw new Error(`Failed to initialize i18n: ${error}`);
  }
}

module.exports = { initializeLocalization, i18n };
