const mainLanguage = process.env.REACT_APP_MAIN_LANGUAGE;
const fallbackLanguage = process.env.REACT_APP_FALLBACK_LANGUAGE;

if (!mainLanguage || !fallbackLanguage) {
  throw new Error('Missing required environment variables for localization');
}

const getResources = () => {
  try {
    // eslint-disable-next-line global-require
    return require('../i18n/localization.json');
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
