require('dotenv').config();

const fs = require('fs');
const path = require('path');

const mainLanguage = process.env.REACT_APP_MAIN_LANGUAGE;
const fallbackLanguage = process.env.REACT_APP_FALLBACK_LANGUAGE;

if (!mainLanguage || !fallbackLanguage) {
  throw new Error('Missing required environment variables for localization');
}

const getResources = () => {
  try {
    const resourcePath = path.join(__dirname, '../i18n/localization.json');
    const data = fs.readFileSync(resourcePath, 'utf8');

    return JSON.parse(data);
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
