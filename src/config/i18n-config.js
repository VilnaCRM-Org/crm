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

const loadRawResources = () => {
  const resourcePath = path.join(__dirname, '../i18n/localization.json');
  const data = fs.readFileSync(resourcePath, 'utf8');
  const resources = JSON.parse(data);
  if (typeof resources !== 'object' || resources === null) {
    throw new Error('Invalid localization resources format: expected object');
  }
  return resources;
};

const assertLanguage = (resources, lang, label) => {
  if (!resources[lang]) {
    throw new Error(`${label} language '${lang}' not found in localization resources`);
  }
};

const getResources = () => {
  try {
    const resources = loadRawResources();
    assertLanguage(resources, mainLanguage, 'Main');
    assertLanguage(resources, fallbackLanguage, 'Fallback');
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
