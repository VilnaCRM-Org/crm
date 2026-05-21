require('dotenv').config();

const fs = require('fs');
const path = require('path');

const mainLanguage = process.env.REACT_APP_MAIN_LANGUAGE;
const fallbackLanguage = process.env.REACT_APP_FALLBACK_LANGUAGE;

if (!mainLanguage || !fallbackLanguage) {
  const missing = [];
  if (!mainLanguage) missing.push('REACT_APP_MAIN_LANGUAGE');
  if (!fallbackLanguage) missing.push('REACT_APP_FALLBACK_LANGUAGE');
  throw new Error(`Missing required environment variables for localization: ${missing.join(', ')}`);
}

const getResources = () => {
  try {
    const resourcePath = path.join(__dirname, '../i18n/localization.json');
    const data = fs.readFileSync(resourcePath, 'utf8');
    const resources = JSON.parse(data);

    if (typeof resources !== 'object' || resources === null) {
      throw new Error('Invalid localization resources format: expected object');
    }

    if (!resources[mainLanguage]) {
      throw new Error(`Main language '${mainLanguage}' not found in localization resources`);
    }
    if (!resources[fallbackLanguage]) {
      throw new Error(
        `Fallback language '${fallbackLanguage}' not found in localization resources`
      );
    }

    return resources;
  } catch (error) {
    throw new Error(`Failed to load localization resources: ${error.message}`);
  }
};

module.exports = {
  lng: mainLanguage,
  resources: getResources(),
  fallbackLng: fallbackLanguage,
  interpolation: {
    escapeValue: false,
  },
};
