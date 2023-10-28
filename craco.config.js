const path = require('path');
const eslint = require('./.eslintrc');
const LocalizationGenerator = require('./scripts/localizationGenerator');

// eslint-disable-next-line
module.exports = function () {
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
