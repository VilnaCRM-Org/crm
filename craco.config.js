const path = require('path');

const eslint = require('./.eslintrc');
const LocalizationGenerator = require('./scripts/localizationGenerator');

module.exports = function cracoConfig() {
  const localizationGenerator = new LocalizationGenerator();
  localizationGenerator.generateLocalizationFile();

  return {
    webpack: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    eslint,
  };
};
