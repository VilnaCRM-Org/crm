const path = require('path');
const LocalizationGenerator = require('./scripts/localizationGenerator');

module.exports = function cracoConfig() {
  const localizationGenerator = new LocalizationGenerator();
  const skipLocaleGen = /^(1|true|yes|on|enabled)$/i.test(process.env.SKIP_LOCALE_GEN || '');

  if (!skipLocaleGen && process.env.NODE_ENV === 'production') {
    try {
      localizationGenerator.generateLocalizationFile();
    } catch (err) {
      const message = `Localization generation failed: ${err instanceof Error ? err.message : String(err)}`;
      let error;
      try {
        error = new Error(message, { cause: err });
      } catch {
        error = new Error(message);
        error.cause = err;
      }
      throw error;
    }
  }

  return {
    webpack: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },

      configure: (webpackConfig) => {
        const imagesRule = {
          test: /\.(png|jpe?g|gif|webp|avif|bmp|ico)$/i,
          type: 'asset',
          parser: { dataUrlCondition: { maxSize: 8 * 1024 } },
          generator: { filename: 'assets/[name].[contenthash:8][ext][query]' },
        };
        const fontsRule = {
          test: /\.(woff2?|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: { filename: 'assets/fonts/[name].[contenthash:8][ext][query]' },
        };
        const faviconRule = {
          test: /favicon\.ico$/i,
          type: 'asset/resource',
          generator: { filename: 'assets/[name].[contenthash:8][ext][query]' },
        };
        const targetRules =
          webpackConfig.module.rules.find((r) => Array.isArray(r.oneOf))?.oneOf ||
          webpackConfig.module.rules;
        const hasTest = (rules, test) =>
          rules.some((r) => r.test && String(r.test) === String(test));
        if (!hasTest(targetRules, faviconRule.test)) targetRules.unshift(faviconRule);
        if (!hasTest(targetRules, fontsRule.test)) targetRules.unshift(fontsRule);
        if (!hasTest(targetRules, imagesRule.test)) targetRules.unshift(imagesRule);
        return webpackConfig;
      },
    },

    style: {
      sass: {
        loaderOptions: {
          sassOptions: { quietDeps: true },
        },
      },
    },

    eslint: {
      enable: true,
      mode: 'file',
    },
  };
};
